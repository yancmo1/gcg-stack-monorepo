from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import sqlite3
import os
import csv
import re

# Helpers must be defined before seeding functions

def _norm_name(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '').strip()).lower()

app = Flask(__name__)
CORS(app)

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
# Guard seeding so the app always starts
try:
    seed_from_csv()
except Exception as e:
    print(f"Seed error: {e}")

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

@api.route('/records', methods=['POST'])
def add_record():
    data = request.json
    if not data:
        return jsonify({'error': 'Missing or invalid JSON body'}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''INSERT INTO records (employee_name, title, region, start_date, completion_date, status, sort_order, notes, trainer, mtl_completed, new_hire_test_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                    (data.get('employee_name'), data.get('title'), data.get('region'), data.get('start_date'), data.get('completion_date'), data.get('status'), data.get('sort_order'), data.get('notes'), data.get('trainer'), data.get('mtl_completed'), data.get('new_hire_test_score')))
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
        cur.execute('''UPDATE records SET 
                       employee_name=?, title=?, region=?, start_date=?, completion_date=?, 
                       status=?, sort_order=?, notes=?, trainer=?, mtl_completed=?, new_hire_test_score=?
                       WHERE id=?''',
                    (data.get('employee_name'), data.get('title'), data.get('region'), 
                     data.get('start_date'), data.get('completion_date'), data.get('status'), 
                     data.get('sort_order'), data.get('notes'), data.get('trainer'), 
                     data.get('mtl_completed'), data.get('new_hire_test_score'), record_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Record updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/records/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT * FROM records WHERE id = ?', (record_id,))
        record = cur.fetchone()
        if not record:
            conn.close()
            return jsonify({'error': 'Record not found'}), 404
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
