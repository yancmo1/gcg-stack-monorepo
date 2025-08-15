from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import sqlite3
import os
import csv
import re
import secrets
import string
from typing import Optional, Dict, Any
try:
    from werkzeug.security import generate_password_hash, check_password_hash
except Exception:
    # Fallback simple hash (not recommended for production)
    import hashlib
    def generate_password_hash(p: str) -> str:
        return hashlib.sha256(p.encode('utf-8')).hexdigest()
    def check_password_hash(h: str, p: str) -> bool:
        return h == hashlib.sha256(p.encode('utf-8')).hexdigest()

# Helpers must be defined before seeding functions

def _norm_name(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '').strip()).lower()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:6002", "http://localhost:6003", "http://100.70.125.100:6002", "http://100.70.125.100:6003"]}}, supports_credentials=True, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Config
PORT = int(os.getenv('PORT', '6001'))
DB_PATH = os.getenv('DATABASE_PATH') or os.path.join(os.path.dirname(__file__), 'database.db')
ENV = os.getenv('FLASK_ENV', 'development')
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = '/data' if os.path.isdir('/data') else os.path.join(PROJECT_ROOT, 'Original Docs data and example')

api = Blueprint('api', __name__, url_prefix='/api')

# Ensure database and table exist
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Records
    cur.execute('''
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_name TEXT,
            title TEXT,
            region TEXT,
            start_date TEXT,
            completion_date TEXT,
            status TEXT,
            sort_order INTEGER,
            notes TEXT,
            trainer TEXT,
            mtl_completed TEXT,
            new_hire_test_score TEXT
        )
    ''')
    # Tests (Initial/Retest) linked to records
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL,
            test_type TEXT CHECK (test_type IN ('Initial','Retest')) NOT NULL,
            test_date TEXT,
            score INTEGER,
            passed INTEGER CHECK (passed IN (0,1)) DEFAULT 0,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(record_id) REFERENCES records(id) ON DELETE CASCADE
        )
    ''')
    # Indexes
    cur.execute('CREATE INDEX IF NOT EXISTS idx_records_status ON records(status)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_records_employee_name ON records(employee_name)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_tests_record_id ON tests(record_id)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_tests_type_date ON tests(test_type, test_date)')

    # Ensure 'group' column exists on records for Learner/Testing separation
    try:
        cur.execute('ALTER TABLE records ADD COLUMN "group" TEXT DEFAULT "Learner"')
    except Exception:
        # Column already exists or SQLite limitation encountered; ignore
        pass

    # Departments
    cur.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    ''')
    # Audit log table for admin actions
    cur.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_user_id INTEGER,
            action TEXT NOT NULL,
            object_type TEXT,
            object_id INTEGER,
            details TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    ''')
    # Users
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK (role IN ('Admin','Manager','User')) DEFAULT 'User',
            department_id INTEGER,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL
        )
    ''')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department_id)')

    conn.commit()
    conn.close()


def _normalize_date(s):
    if not s:
        return ''
    s = str(s).strip()
    if not s:
        return ''
    # already ISO
    if len(s) == 10 and s[4] == '-' and s[7] == '-':
        return s
    # Try M/D/YY or MM/DD/YYYY
    parts = s.replace('-', '/').split('/')
    try:
        if len(parts) == 3:
            m = int(parts[0]); d = int(parts[1]); y = int(parts[2])
            if y < 100:
                y = 2000 + y if y <= 30 else 1900 + y
            return f"{y:04d}-{m:02d}-{d:02d}"
    except Exception:
        return s
    return s


def _parse_status_to_score_pass(status_val):
    s = (str(status_val or '')).strip()
    if not s:
        return None, 0
    # Try numeric
    try:
        n = int(s)
        return n, 1 if n >= 70 else 0
    except Exception:
        pass
    s_low = s.lower()
    if s_low in ('completed', 'pass', 'passed', 'yes', 'y', 'true'):
        return None, 1
    if s_low in ('failed', 'fail', 'no', 'n', 'false'):
        return None, 0
    return None, 0


# ---- Departments helpers (validation & RBAC) ----
_DEPT_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 &\-/]{0,62}[A-Za-z0-9]$")

def _validate_department_name(name: str) -> Optional[str]:
    """Return error message if invalid, else None."""
    if name is None:
        return 'Name required'
    name = name.strip()
    if len(name) < 2 or len(name) > 64:
        return 'Name must be 2-64 characters'
    if not _DEPT_NAME_RE.match(name):
        return 'Name may contain letters, numbers, spaces, hyphens or slashes'
    return None

def _department_exists_case_insensitive(cur, name: str, exclude_id: Optional[int] = None) -> bool:
    params: list[Any] = [name.strip().lower()]
    sql = 'SELECT id FROM departments WHERE LOWER(name)=?'
    if exclude_id is not None:
        sql += ' AND id != ?'
        params.append(int(exclude_id))
    cur.execute(sql, params)
    return cur.fetchone() is not None


def seed_from_csv():
    if not os.path.isdir(DATA_DIR):
        return
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Clear only tests so reseeding is visible; keep records intact
    try:
        cur.execute('DELETE FROM tests')
    except Exception:
        pass

    def upsert_record(row):
        employee = (row.get('employee_name') or row.get('Employee Name') or row.get('Name') or '').strip()
        title = (row.get('title') or row.get('Title') or '').strip()
        region = (row.get('region') or row.get('Region') or '').strip()
        start_date = _normalize_date(row.get('start_date') or row.get('Start Date') or '')
        completion_date = _normalize_date(row.get('completion_date') or row.get('Completion Date') or '')
        status = (row.get('status') or row.get('Status') or '').strip()
        notes = (row.get('notes') or row.get('Notes') or '').strip()
        trainer = (row.get('trainer') or row.get('Trainer') or '').strip()
        mtl = (row.get('mtl_completed') or row.get('MTL Completed') or row.get('MTL') or '').strip()
        score = (row.get('new_hire_test_score') or row.get('New Hire Test Score') or '').strip()

        if not employee:
            return None
        cur.execute('''SELECT id FROM records WHERE TRIM(LOWER(employee_name)) = TRIM(LOWER(?)) AND IFNULL(title,'') = ? AND IFNULL(start_date,'') = ?''',
                    (employee, title, start_date))
        rec = cur.fetchone()
        if rec:
            return rec['id']
        cur.execute('''INSERT INTO records (employee_name, title, region, start_date, completion_date, status, notes, trainer, mtl_completed, new_hire_test_score)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                    (employee, title, region, start_date, completion_date, status, notes, trainer, mtl, score))
        return cur.lastrowid

    def find_record_id_by_name(name):
        if not name:
            return None
        n = _norm_name(name)
        # exact normalized
        cur.execute("SELECT id FROM records WHERE TRIM(LOWER(employee_name)) = ? ORDER BY id DESC LIMIT 1", (n,))
        r = cur.fetchone()
        if r:
            return r['id']
        # try space-collapsed LIKE
        like = f"%{n}%"
        cur.execute("SELECT id, employee_name FROM records", ())
        rows = cur.fetchall()
        for row in rows:
            if _norm_name(row['employee_name']) == n:
                return row['id']
        for row in rows:
            if n in _norm_name(row['employee_name']):
                return row['id']
        # not found: create minimal record so tests are not dropped
        cur.execute('''INSERT INTO records (employee_name, status) VALUES (?, ?)''', (name.strip(), 'In Progress'))
        return cur.lastrowid

    def insert_test(record_id, test_type, test_date, score_val, status_val, tier_notes):
        if not record_id:
            return 0
        test_date = _normalize_date(test_date)
        score_num, passed_int_from_status = _parse_status_to_score_pass(status_val)
        if score_num is None:
            # try numeric provided value
            try:
                score_num = int(score_val) if str(score_val).strip() else None
            except Exception:
                score_num = None
        passed_int = passed_int_from_status
        if passed_int is None:
            passed_int = 1 if (score_num is not None and score_num >= 70) else 0
        # idempotent check
        cur.execute('''SELECT id FROM tests WHERE record_id=? AND test_type=? AND IFNULL(test_date,'')=? AND IFNULL(score,-1)=IFNULL(?, -1)''',
                    (record_id, test_type, test_date, score_num))
        if cur.fetchone():
            return 0
        cur.execute('''INSERT INTO tests (record_id, test_type, test_date, score, passed, notes)
                       VALUES (?, ?, ?, ?, ?, ?)''',
                    (record_id, test_type, test_date, score_num, passed_int, (tier_notes or ''))) 
        return 1

    inserted_records = 0
    inserted_tests = 0

    # Process Tracker CSV for records
    tracker_path = os.path.join(DATA_DIR, 'Training LMS Tracker(Tracker) (1).csv')
    if os.path.isfile(tracker_path):
        with open(tracker_path, newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                before = conn.total_changes
                rec_id = upsert_record(row)
                if rec_id and conn.total_changes > before:
                    inserted_records += 1

    # Process Testing Schedule (Initial tests)
    schedule_path = os.path.join(DATA_DIR, 'Training LMS Tracker(Testing Schedule).csv')
    if os.path.isfile(schedule_path):
        with open(schedule_path, newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('Name')
                date = row.get('Date')
                tier = row.get('Tier')  # notes
                status = row.get('Status')
                rec_id = find_record_id_by_name(name)
                inserted_tests += insert_test(rec_id, 'Initial', date, None, status, tier)

    # Process Retest CSV (Retests)
    retest_path = os.path.join(DATA_DIR, 'Training LMS Tracker(Retest).csv')
    if os.path.isfile(retest_path):
        with open(retest_path, newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('Name')
                date = row.get('Date')
                tier = row.get('Tier')
                status = row.get('Status')
                rec_id = find_record_id_by_name(name)
                inserted_tests += insert_test(rec_id, 'Retest', date, None, status, tier)

    conn.commit()
    conn.close()
    print(f"Seed CSV done: +records {inserted_records}, +tests {inserted_tests}")


init_db()
# Guard seeding so the app always starts (could be gated by env flag later)
try:
    seed_from_csv()
except Exception as e:
    print(f"Seed error: {e}")

# --- Seed default departments ---
def seed_default_departments():
    defaults = [
        ('Game Tech', 'Game Tech Department'),
        ('Prep Tech', 'Prep Tech Department'),
        ('PM Tech', 'PM Tech Department'),
    ]
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    for name, desc in defaults:
        try:
            cur.execute('INSERT OR IGNORE INTO departments (name, description) VALUES (?, ?)', (name, desc))
        except Exception:
            pass
    conn.commit()
    conn.close()

try:
    seed_default_departments()
except Exception as e:
    print(f"Dept seed error: {e}")

# --- Assessments blueprint (prototype) ---
try:
    from assessments import assessments_bp, init_assessment_tables
    init_assessment_tables()
    app.register_blueprint(assessments_bp)
except Exception as _e:
    print(f"Assessments module load failed: {_e}")

# Helper function to get DB connection
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Health endpoint
@app.get('/health')
def health():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT 1')
        conn.close()
        return jsonify({
            'status': 'ok',
            'env': ENV,
            'db': 'ok'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Error handlers
@app.errorhandler(400)
def handle_400(e):
    return jsonify({'error': 'Bad Request', 'message': str(e)}), 400

@app.errorhandler(404)
def handle_404(e):
    return jsonify({'error': 'Not Found'}), 404

@app.errorhandler(500)
def handle_500(e):
    return jsonify({'error': 'Internal Server Error'}), 500

# Existing routes moved under blueprint
@api.route('/records', methods=['GET'])
def get_records():
    # Query params
    page = request.args.get('page', type=int)
    page_size = request.args.get('pageSize', type=int)
    search = request.args.get('search', type=str)
    status = request.args.get('status', type=str)

    conn = get_db()
    cur = conn.cursor()

    base_query = 'SELECT * FROM records'
    where_clauses = []
    params = []

    if status:
        where_clauses.append('status = ?')
        params.append(status)

    if search:
        like = f"%{search}%"
        where_clauses.append('(employee_name LIKE ? OR title LIKE ? OR region LIKE ? OR notes LIKE ? OR trainer LIKE ? OR status LIKE ?)')
        params.extend([like, like, like, like, like, like])

    if where_clauses:
        base_query += ' WHERE ' + ' AND '.join(where_clauses)

    # If no pagination/filter params, return legacy array
    if page is None and page_size is None and search is None and status is None:
        cur.execute(base_query + ' ORDER BY id DESC', params)
        rows = cur.fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])

    # Paginated flow
    total_query = base_query.replace('SELECT *', 'SELECT COUNT(*) as cnt')
    cur.execute(total_query, params)
    total = cur.fetchone()['cnt']

    page = page or 1
    page_size = page_size or 50
    offset = (page - 1) * page_size

    cur.execute(base_query + ' ORDER BY id DESC LIMIT ? OFFSET ?', params + [page_size, offset])
    rows = cur.fetchall()
    conn.close()

    return jsonify({
        'items': [dict(row) for row in rows],
        'total': total,
        'page': page,
        'pageSize': page_size
    })

# ===== Departments API =====
@api.route('/departments', methods=['GET'])
def list_departments():
    conn = get_db()
    cur = conn.cursor()
    # Return departments with counts of referencing users
    cur.execute('''SELECT d.id, d.name, d.description, d.created_at,
                      (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) AS user_count
                   FROM departments d ORDER BY d.name ASC''')
    rows = [dict(zip([c[0] for c in cur.description], r)) for r in cur.fetchall()]
    conn.close()
    return jsonify({'departments': rows})


def _get_request_user():
    """Simple RBAC: read X-USER-ID header and fetch user record. Returns dict or None."""
    uid = request.headers.get('X-USER-ID')
    if not uid:
        return None
    try:
        uid_i = int(uid)
    except Exception:
        return None
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, username, role FROM users WHERE id=?', (uid_i,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    return {'id': row['id'], 'username': row['username'], 'role': row['role']}


def _log_audit(actor_user_id, action, object_type, object_id=None, details=None):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('INSERT INTO audit_logs (actor_user_id, action, object_type, object_id, details) VALUES (?, ?, ?, ?, ?)',
                    (actor_user_id, action, object_type, object_id, details))
        conn.commit()
        conn.close()
    except Exception:
        pass


@api.route('/departments', methods=['POST'])
def create_department():
    # Admin-only for creating departments
    actor = _get_request_user()
    if not actor or actor.get('role') != 'Admin':
        return jsonify({'error': 'Admin privileges required'}), 403
    data = request.json or {}
    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip()
    err = _validate_department_name(name)
    if err:
        return jsonify({'error': err}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        # Case-insensitive uniqueness guard for SQLite
        if _department_exists_case_insensitive(cur, name):
            conn.close()
            return jsonify({'error': 'Department already exists'}), 409
        cur.execute('INSERT INTO departments (name, description) VALUES (?, ?)', (name, description))
        conn.commit()
        dept_id = cur.lastrowid
        conn.close()
        _log_audit(actor.get('id'), 'create_department', 'department', dept_id, f'name={name}')
        return jsonify({'id': dept_id, 'message': 'Department created'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Department already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/departments/<int:dept_id>', methods=['PUT'])
def update_department(dept_id: int):
    # Admin-only
    actor = _get_request_user()
    if not actor or actor.get('role') != 'Admin':
        return jsonify({'error': 'Admin privileges required'}), 403
    data = request.json or {}
    name = (data.get('name') or '').strip()
    description = data.get('description') if 'description' in data else None
    err = _validate_department_name(name)
    if err:
        return jsonify({'error': err}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT id, name, description FROM departments WHERE id=?', (dept_id,))
        existing = cur.fetchone()
        if not existing:
            conn.close()
            return jsonify({'error': 'Department not found'}), 404
        # Case-insensitive uniqueness guard ignoring current id
        if _department_exists_case_insensitive(cur, name, exclude_id=dept_id):
            conn.close()
            return jsonify({'error': 'Department name already exists'}), 409
        old_name = existing['name']
        # Preserve existing description if not provided
        new_description = description if description is not None else existing['description']
        cur.execute('UPDATE departments SET name=?, description=? WHERE id=?', (name, new_description, dept_id))
        conn.commit()
        conn.close()
        _log_audit(actor.get('id'), 'update_department', 'department', dept_id, f'from={old_name} to={name}')
        return jsonify({'message': 'Department updated'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Department name already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/departments/<int:dept_id>', methods=['DELETE'])
def delete_or_merge_department(dept_id: int):
    # Admin-only
    actor = _get_request_user()
    if not actor or actor.get('role') != 'Admin':
        return jsonify({'error': 'Admin privileges required'}), 403
    merge_into = request.args.get('mergeInto')
    try:
        conn = get_db()
        cur = conn.cursor()
        # verify source exists
        cur.execute('SELECT id, name FROM departments WHERE id=?', (dept_id,))
        src = cur.fetchone()
        if not src:
            conn.close()
            return jsonify({'error': 'Department not found'}), 404
        src_name = src['name']
        # count children
        cur.execute('SELECT COUNT(*) as ucnt FROM users WHERE department_id=?', (dept_id,))
        ucnt = cur.fetchone()['ucnt']
        # Check if records table has department_id column (may not exist in all schemas)
        try:
            cur.execute('SELECT COUNT(*) as rcnt FROM records WHERE department_id=?', (dept_id,))
            rcnt = cur.fetchone()['rcnt']
        except Exception:
            rcnt = 0
        if merge_into:
            # merge into provided department id
            try:
                merge_into_id = int(merge_into)
            except Exception:
                conn.close()
                return jsonify({'error': 'Invalid mergeInto id'}), 400
            # verify target exists
            cur.execute('SELECT id, name FROM departments WHERE id=?', (merge_into_id,))
            target = cur.fetchone()
            if not target:
                conn.close()
                return jsonify({'error': 'Target department not found'}), 404
            # reassign users
            cur.execute('UPDATE users SET department_id=? WHERE department_id=?', (merge_into_id, dept_id))
            # reassign records if column exists
            try:
                cur.execute('UPDATE records SET department_id=? WHERE department_id=?', (merge_into_id, dept_id))
            except Exception:
                pass
            # delete source
            cur.execute('DELETE FROM departments WHERE id=?', (dept_id,))
            conn.commit()
            conn.close()
            _log_audit(actor.get('id'), 'merge_department', 'department', dept_id, f'merged_into={merge_into_id}')
            return jsonify({'message': f'Merged into department {merge_into_id}'})
        else:
            # if children exist, prevent deletion
            if ucnt > 0 or rcnt > 0:
                conn.close()
                return jsonify({'error': 'Department has child references; provide mergeInto to reassign or reassign children first'}), 400
            cur.execute('DELETE FROM departments WHERE id=?', (dept_id,))
            conn.commit()
            conn.close()
            _log_audit(actor.get('id'), 'delete_department', 'department', dept_id, f'deleted {src_name}')
            return jsonify({'message': 'Department deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== Users API =====
@api.route('/users', methods=['GET'])
def list_users():
    """List all users with department info."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        SELECT u.id, u.username, u.role, u.department_id, u.created_at,
               d.name as department_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY u.created_at DESC
    ''')
    rows = cur.fetchall()
    conn.close()
    return jsonify({'users': [dict(row) for row in rows]})


def _generate_password(length=12):
    """Generate a secure random password."""
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(chars) for _ in range(length))


@api.route('/users', methods=['POST'])
def create_user():
    """Create a new user with auto-generated password if not provided."""
    actor = _get_request_user()
    if not actor or actor.get('role') != 'Admin':
        return jsonify({'error': 'Admin privileges required'}), 403
        
    data = request.json or {}
    username = data.get('username', '').strip()
    role = data.get('role', 'User').strip()
    department_id = data.get('departmentId') or data.get('department_id')
    password = data.get('password', '').strip()
    
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    if role not in ('Admin', 'Manager', 'User'):
        return jsonify({'error': 'Invalid role'}), 400
    
    # Auto-generate password if not provided
    if not password:
        password = _generate_password()
    
    password_hash = generate_password_hash(password)
    
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''INSERT INTO users (username, password_hash, role, department_id)
                       VALUES (?, ?, ?, ?)''',
                    (username, password_hash, role, department_id))
        conn.commit()
        user_id = cur.lastrowid
        conn.close()
        
        _log_audit(actor.get('id'), 'create_user', 'user', user_id, f'username={username}, role={role}')
        return jsonify({'id': user_id, 'message': 'User created', 'password': password}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id: int):
    """Update user username, role, or department."""
    actor = _get_request_user()
    if not actor or actor.get('role') != 'Admin':
        return jsonify({'error': 'Admin privileges required'}), 403
    
    data = request.json or {}
    username = data.get('username', '').strip()
    role = data.get('role', '').strip()
    department_id = data.get('department_id')
    
    if role and role not in ('Admin', 'Manager', 'User'):
        return jsonify({'error': 'Invalid role'}), 400
    
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute('SELECT id, username, role FROM users WHERE id = ?', (user_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Build update query dynamically
        updates = []
        params = []
        if username:
            updates.append('username = ?')
            params.append(username)
        if role:
            updates.append('role = ?')
            params.append(role)
        if department_id is not None:
            updates.append('department_id = ?')
            params.append(department_id)
        
        if not updates:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        
        params.append(user_id)
        update_sql = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        cur.execute(update_sql, params)
        conn.commit()
        conn.close()
        
        _log_audit(actor.get('id'), 'update_user', 'user', user_id, f'updated fields: {", ".join(data.keys())}')
        return jsonify({'message': 'User updated'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id: int):
    """Delete a user."""
    actor = _get_request_user()
    if not actor or actor.get('role') != 'Admin':
        return jsonify({'error': 'Admin privileges required'}), 403
    
    # Prevent admin from deleting themselves
    if actor.get('id') == user_id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute('SELECT id, username FROM users WHERE id = ?', (user_id,))
        user = cur.fetchone()
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        cur.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        conn.close()
        
        _log_audit(actor.get('id'), 'delete_user', 'user', user_id, f'deleted username={user["username"]}')
        return jsonify({'message': 'User deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/users/<int:user_id>/reset-password', methods=['POST'])
def reset_user_password(user_id: int):
    """Reset a user's password with a new auto-generated one."""
    actor = _get_request_user()
    if not actor or actor.get('role') != 'Admin':
        return jsonify({'error': 'Admin privileges required'}), 403
    
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute('SELECT id, username FROM users WHERE id = ?', (user_id,))
        user = cur.fetchone()
        if not user:
            conn.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Generate new password
        new_password = _generate_password()
        password_hash = generate_password_hash(new_password)
        
        cur.execute('UPDATE users SET password_hash = ? WHERE id = ?', (password_hash, user_id))
        conn.commit()
        conn.close()
        
        _log_audit(actor.get('id'), 'reset_password', 'user', user_id, f'reset password for username={user["username"]}')
        return jsonify({'message': 'Password reset', 'password': new_password})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== Authentication API =====
@api.route('/auth/login', methods=['POST'])
def login():
    """Authenticate user and return user info."""
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            SELECT u.id, u.username, u.password_hash, u.role, u.department_id,
                   d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.username = ?
        ''', (username,))
        user = cur.fetchone()
        conn.close()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Return user info (excluding password hash)
        user_info = {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'department_id': user['department_id'],
            'department_name': user['department_name']
        }
        
        _log_audit(user['id'], 'login', 'auth', None, f'successful login from {request.remote_addr}')
        return jsonify({'user': user_info, 'message': 'Login successful'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api.route('/auth/logout', methods=['POST'])
def logout():
    """Log out current user."""
    user_id = request.headers.get('X-USER-ID')
    if user_id:
        _log_audit(int(user_id), 'logout', 'auth', None, f'logout from {request.remote_addr}')
    return jsonify({'message': 'Logged out successfully'})


@api.route('/auth/me', methods=['GET'])
def get_current_user():
    """Get current user info based on X-USER-ID header."""
    user = _get_request_user()
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    
    # Get department info
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            SELECT u.id, u.username, u.role, u.department_id,
                   d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ?
        ''', (user['id'],))
        user_data = cur.fetchone()
        conn.close()
        
        if user_data:
            return jsonify({'user': dict(user_data)})
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- Learners endpoints (alias to records for dev) ---
@api.route('/learners', methods=['GET'])
def learners_list():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM records ORDER BY id DESC')
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    # Map records fields to learners
    for r in rows:
        r['group'] = r.get('group') or 'Learner'
    return jsonify(rows)

@api.route('/learners', methods=['POST'])
def learners_add():
    data = request.json or {}
    # Reuse add_record logic
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''INSERT INTO records (employee_name, title, region, start_date, completion_date, status, sort_order, notes, trainer, mtl_completed, new_hire_test_score, "group")
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                    (data.get('employee_name'), data.get('title'), data.get('region'), data.get('start_date'), data.get('completion_date'), data.get('status') or 'In Progress', data.get('sort_order'), data.get('notes'), data.get('trainer'), data.get('mtl_completed'), data.get('new_hire_test_score'), data.get('group') or 'Learner'))
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return jsonify({'message': 'Learner added', 'id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/learners/<int:learner_id>', methods=['PUT'])
def learners_update(learner_id):
    data = request.json or {}
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT * FROM records WHERE id = ?', (learner_id,))
        rec = cur.fetchone()
        if not rec:
            conn.close()
            return jsonify({'error': 'Learner not found'}), 404
        cur.execute('''UPDATE records SET 
                       employee_name=?, title=?, region=?, start_date=?, completion_date=?, 
                       status=?, sort_order=?, notes=?, trainer=?, mtl_completed=?, new_hire_test_score=?, "group"=?
                       WHERE id=?''',
                    (data.get('employee_name'), data.get('title'), data.get('region'), 
                     data.get('start_date'), data.get('completion_date'), data.get('status'), 
                     data.get('sort_order'), data.get('notes'), data.get('trainer'), 
                     data.get('mtl_completed'), data.get('new_hire_test_score'), data.get('group') or 'Learner', learner_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Learner updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/learners/<int:learner_id>', methods=['DELETE'])
def learners_delete(learner_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT id FROM records WHERE id = ?', (learner_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({'error': 'Learner not found'}), 404
        cur.execute('DELETE FROM records WHERE id = ?', (learner_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Learner deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/records', methods=['POST'])
def add_record():
    data = request.json
    if not data:
        return jsonify({'error': 'Missing or invalid JSON body'}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            '''INSERT INTO records (employee_name, title, region, start_date, completion_date, status, sort_order, notes, trainer, mtl_completed, new_hire_test_score, "group")
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                data.get('employee_name'), data.get('title'), data.get('region'),
                data.get('start_date'), data.get('completion_date'), data.get('status'),
                data.get('sort_order'), data.get('notes'), data.get('trainer'),
                data.get('mtl_completed'), data.get('new_hire_test_score'), data.get('group') or 'Learner'
            )
        )
        conn.commit()
        new_id = cur.lastrowid
        conn.close()
        return jsonify({'message': 'Record added', 'id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/records/<int:record_id>', methods=['PUT'])
def update_record(record_id):
    data = request.json
    if not data:
        return jsonify({'error': 'Missing or invalid JSON body'}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT * FROM records WHERE id = ?', (record_id,))
        record = cur.fetchone()
        if not record:
            conn.close()
            return jsonify({'error': 'Record not found'}), 404
        # Update record
        cur.execute('''UPDATE records SET 
                       employee_name=?, title=?, region=?, start_date=?, completion_date=?, 
                       status=?, sort_order=?, notes=?, trainer=?, mtl_completed=?, new_hire_test_score=?, "group"=?
                       WHERE id=?''',
                    (data.get('employee_name'), data.get('title'), data.get('region'), 
                     data.get('start_date'), data.get('completion_date'), data.get('status'), 
                     data.get('sort_order'), data.get('notes'), data.get('trainer'), 
                     data.get('mtl_completed'), data.get('new_hire_test_score'), data.get('group') or 'Learner', record_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Record updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.delete('/records/<int:record_id>')
def delete_record(record_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        
        # Check if record exists
        cur.execute('SELECT id FROM records WHERE id = ?', (record_id,))
        if not cur.fetchone():
            conn.close()
            return jsonify({'error': 'Record not found'}), 404
        
        # Delete the record
        cur.execute('DELETE FROM records WHERE id = ?', (record_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Record deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.get('/records/<int:record_id>/tests')
def list_record_tests(record_id):
    type_filter = request.args.get('type')  # 'Initial'|'Retest' optional
    page = request.args.get('page', type=int) or 1
    page_size = request.args.get('pageSize', type=int) or 50
    offset = (page - 1) * page_size

    conn = get_db()
    cur = conn.cursor()

    # Ensure record exists
    cur.execute('SELECT id FROM records WHERE id = ?', (record_id,))
    if not cur.fetchone():
        conn.close()
        return jsonify({'error': 'Record not found'}), 404

    where = ['record_id = ?']
    params = [record_id]
    if type_filter in ('Initial', 'Retest'):
        where.append('test_type = ?')
        params.append(type_filter)

    where_sql = ' AND '.join(where)

    cur.execute(f'SELECT COUNT(*) as cnt FROM tests WHERE {where_sql}', params)
    total = cur.fetchone()['cnt']

    cur.execute(f'''SELECT id, record_id, test_type, test_date, score, passed, notes, created_at
                    FROM tests
                    WHERE {where_sql}
                    ORDER BY test_date DESC, id DESC
                    LIMIT ? OFFSET ?''', params + [page_size, offset])
    rows = cur.fetchall()
    conn.close()

    return jsonify({
        'items': [dict(row) for row in rows],
        'total': total,
        'page': page,
        'pageSize': page_size
    })

@api.post('/records/<int:record_id>/tests')
def add_record_test(record_id):
    data = request.json or {}
    test_type = data.get('test_type')
    if test_type not in ('Initial', 'Retest'):
        return jsonify({'error': "test_type must be 'Initial' or 'Retest'"}), 400

    conn = get_db()
    cur = conn.cursor()

    # Verify record exists
    cur.execute('SELECT id FROM records WHERE id = ?', (record_id,))
    if not cur.fetchone():
        conn.close()
        return jsonify({'error': 'Record not found'}), 404

    cur.execute('''INSERT INTO tests (record_id, test_type, test_date, score, passed, notes)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (record_id, test_type, data.get('test_date'), data.get('score'),
                 1 if data.get('passed') in (True, 'true', 'True', 1, '1', 'yes', 'Yes') else 0,
                 data.get('notes')))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()

    return jsonify({'message': 'Test added', 'id': new_id}), 201

@api.get('/tests')
def list_tests():
    type_filter = request.args.get('type')
    page = request.args.get('page', type=int) or 1
    page_size = request.args.get('pageSize', type=int) or 50
    offset = (page - 1) * page_size

    conn = get_db()
    cur = conn.cursor()

    where = []
    params = []
    if type_filter in ('Initial', 'Retest'):
        where.append('t.test_type = ?')
        params.append(type_filter)

    where_sql = (' WHERE ' + ' AND '.join(where)) if where else ''

    cur.execute(f'''SELECT COUNT(*) as cnt
                    FROM tests t{where_sql}''', params)
    total = cur.fetchone()['cnt']

    cur.execute(f'''SELECT t.id, t.record_id, t.test_type, t.test_date, t.score, t.passed, t.notes, t.created_at,
                       r.employee_name, r.title, r.region
                FROM tests t
                JOIN records r ON r.id = t.record_id
                {where_sql}
                ORDER BY t.test_date DESC, t.id DESC
                LIMIT ? OFFSET ?''', params + [page_size, offset])
    rows = cur.fetchall()
    conn.close()

    return jsonify({
        'items': [dict(row) for row in rows],
        'total': total,
        'page': page,
        'pageSize': page_size
    })


# --- Dashboard Metrics Endpoints ---
@api.route('/metrics/summary')
def metrics_summary():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*) as total FROM records')
    total = cur.fetchone()['total']
    cur.execute("SELECT COUNT(*) as completed FROM records WHERE status = 'Completed'")
    completed = cur.fetchone()['completed']
    cur.execute("SELECT COUNT(*) as inprogress FROM records WHERE status = 'In Progress'")
    inprogress = cur.fetchone()['inprogress']
    # Overdue: not completed, start_date older than 30 days ago
    cur.execute("SELECT COUNT(*) as overdue FROM records WHERE status != 'Completed' AND start_date IS NOT NULL AND start_date != '' AND date(start_date) < date('now', '-30 days')")
    overdue = cur.fetchone()['overdue']
    conn.close()
    return jsonify({
        'totalRecords': total,
        'completed': completed,
        'inProgress': inprogress,
        'overdue': overdue
    })

@api.route('/metrics/tests')
def metrics_tests():
    conn = get_db()
    cur = conn.cursor()
    # Last 30 days Initial/Retest counts
    cur.execute("SELECT test_type, COUNT(*) as cnt FROM tests WHERE test_date >= date('now', '-30 days') GROUP BY test_type")
    rows = cur.fetchall()
    last30 = {r['test_type']: r['cnt'] for r in rows}
    # Pass rate last 30 days
    cur.execute("SELECT COUNT(*) as total, SUM(passed) as passed FROM tests WHERE test_date >= date('now', '-30 days')")
    row = cur.fetchone()
    total = row['total'] or 0
    passed = row['passed'] or 0
    pass_rate = (passed / total * 100) if total else 0
    # Recent 10 tests
    cur.execute("""
        SELECT t.id, t.test_type, t.test_date, t.score, t.passed, t.notes, r.employee_name, r.title
        FROM tests t JOIN records r ON t.record_id = r.id
        ORDER BY t.test_date DESC, t.id DESC LIMIT 10
    """)
    recent = [dict(row) for row in cur.fetchall()]
    conn.close()
    return jsonify({
        'last30Days': last30,
        'passRateLast30': pass_rate,
        'recent': recent
    })

# Register blueprint
app.register_blueprint(api)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=(ENV == 'development'))
