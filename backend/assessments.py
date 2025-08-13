from flask import Blueprint, request, jsonify
import sqlite3
import os
import datetime

# Reuse existing DB path logic (mirrors app.py logic lightly without import cycle)
DB_PATH = os.getenv('DATABASE_PATH') or os.path.join(os.path.dirname(__file__), 'database.db')

assessments_bp = Blueprint('assessments', __name__, url_prefix='/api')

# Allowed item types for validation
ALLOWED_ITEM_TYPES = {"boolean", "score", "text"}

# --- Table Initialization ---

def init_assessment_tables():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Templates (high-level definition of an assessment)
    cur.execute('''CREATE TABLE IF NOT EXISTS assessment_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        pass_score_threshold REAL DEFAULT 70, -- percent threshold to mark pass
        total_weight REAL DEFAULT 0,          -- cached sum of item weights
        created_at TEXT DEFAULT (datetime('now'))
    )''')

    # Items belonging to a template
    cur.execute('''CREATE TABLE IF NOT EXISTS assessment_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        order_index INTEGER NOT NULL DEFAULT 0,
        label TEXT NOT NULL,
        item_type TEXT NOT NULL,              -- e.g., 'boolean','score'
        max_score REAL DEFAULT 1,             -- only used for numeric/score items
        weight REAL DEFAULT 1,                -- weight in final aggregation
        FOREIGN KEY(template_id) REFERENCES assessment_templates(id) ON DELETE CASCADE
    )''')

    # Concrete assessment instance for a learner/record
    cur.execute('''CREATE TABLE IF NOT EXISTS assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER NOT NULL,
        template_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        completed_at TEXT,
        total_score REAL,                     -- aggregated numeric score (weighted)
        max_score REAL,                       -- theoretical max weighted score
        passed INTEGER,                       -- 0/1
        FOREIGN KEY(record_id) REFERENCES records(id) ON DELETE CASCADE,
        FOREIGN KEY(template_id) REFERENCES assessment_templates(id) ON DELETE RESTRICT
    )''')

    # Individual responses
    cur.execute('''CREATE TABLE IF NOT EXISTS assessment_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        value_text TEXT,                      -- raw textual / boolean / numeric text
        numeric_score REAL,                   -- interpreted numeric (0..max)
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
        FOREIGN KEY(item_id) REFERENCES assessment_items(id) ON DELETE CASCADE
    )''')

    # Helpful indexes
    cur.execute('CREATE INDEX IF NOT EXISTS idx_assessments_record ON assessments(record_id)')
    cur.execute('CREATE INDEX IF NOT EXISTS idx_assessment_items_template ON assessment_items(template_id)')

    conn.commit()
    conn.close()


# Utility

def _get_conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def _template_to_dict(tpl, items=None):
    d = dict(tpl)
    if items is not None:
        d['items'] = items
    return d


def _compute_template_weight(cur, template_id):
    cur.execute('SELECT IFNULL(SUM(weight),0) as tw FROM assessment_items WHERE template_id=?', (template_id,))
    tw = cur.fetchone()['tw']
    cur.execute('UPDATE assessment_templates SET total_weight=? WHERE id=?', (tw, template_id))


# --- Endpoints ---

@assessments_bp.route('/assessment-templates', methods=['GET'])
def list_templates():
    conn = _get_conn(); cur = conn.cursor()
    cur.execute('SELECT * FROM assessment_templates ORDER BY id DESC')
    templates = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(templates)


@assessments_bp.route('/assessment-templates', methods=['POST'])
def create_template():
    data = request.json or {}
    name = data.get('name')
    items = data.get('items', [])
    pass_threshold_raw = data.get('pass_score_threshold', 70)
    errors = []

    # Basic validation
    if not name:
        errors.append('name is required')
    if not isinstance(items, list) or len(items) == 0:
        errors.append('items must be a non-empty list')
    pass_threshold = 70.0
    try:
        pass_threshold = float(pass_threshold_raw)
        if pass_threshold <= 0 or pass_threshold > 100:
            errors.append('pass_score_threshold must be between 0 and 100')
    except Exception:
        errors.append('pass_score_threshold must be numeric')

    # Validate items
    for idx, item in enumerate(items):
        label = item.get('label')
        if not label:
            errors.append(f'items[{idx}].label required')
        item_type = item.get('item_type', 'boolean')
        if item_type not in ALLOWED_ITEM_TYPES:
            errors.append(f'items[{idx}].item_type invalid: {item_type}')
        try:
            max_score = float(item.get('max_score', 1))
            if max_score <= 0:
                errors.append(f'items[{idx}].max_score must be > 0')
        except Exception:
            errors.append(f'items[{idx}].max_score must be numeric')
        try:
            weight = float(item.get('weight', 1))
            if weight <= 0:
                errors.append(f'items[{idx}].weight must be > 0')
        except Exception:
            errors.append(f'items[{idx}].weight must be numeric')

    if errors:
        return jsonify({'error': 'validation_error', 'details': errors}), 400

    conn = _get_conn(); cur = conn.cursor()
    cur.execute('INSERT INTO assessment_templates (name, pass_score_threshold) VALUES (?, ?)', (name, pass_threshold))
    tpl_id = cur.lastrowid

    for order_index, item in enumerate(items):
        cur.execute('''INSERT INTO assessment_items (template_id, order_index, label, item_type, max_score, weight)
                       VALUES (?, ?, ?, ?, ?, ?)''', (
            tpl_id,
            order_index,
            item.get('label'),
            item.get('item_type', 'boolean'),
            float(item.get('max_score', 1)),
            float(item.get('weight', 1))
        ))

    _compute_template_weight(cur, tpl_id)
    conn.commit()
    cur.execute('SELECT * FROM assessment_templates WHERE id=?', (tpl_id,))
    tpl = cur.fetchone()
    cur.execute('SELECT * FROM assessment_items WHERE template_id=? ORDER BY order_index', (tpl_id,))
    items_rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify(_template_to_dict(tpl, items_rows)), 201


@assessments_bp.route('/assessment-templates/sample', methods=['POST'])
def create_sample_template():
    """Idempotent creation of a sample 'Tier 1 Assessment' template for demonstration."""
    conn = _get_conn(); cur = conn.cursor()
    cur.execute("SELECT id FROM assessment_templates WHERE name=? ORDER BY version DESC LIMIT 1", ("Tier 1 Assessment",))
    existing = cur.fetchone()
    if existing:
        tid = existing['id']
        cur.execute('SELECT * FROM assessment_templates WHERE id=?', (tid,))
        tpl = cur.fetchone()
        cur.execute('SELECT * FROM assessment_items WHERE template_id=? ORDER BY order_index', (tid,))
        items_rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return jsonify({'message': 'exists', 'template': _template_to_dict(tpl, items_rows)}), 200

    # Minimal representative sample items (weights & scoring placeholders)
    sample_items = [
        {'label': 'Safety Procedures Followed', 'item_type': 'boolean', 'max_score': 1, 'weight': 2},
        {'label': 'Tool Handling Accuracy', 'item_type': 'score', 'max_score': 10, 'weight': 3},
        {'label': 'Communication Clarity', 'item_type': 'score', 'max_score': 5, 'weight': 2},
        {'label': 'Checklist Completion', 'item_type': 'boolean', 'max_score': 1, 'weight': 1},
        {'label': 'Time to Complete Task (Efficiency)', 'item_type': 'score', 'max_score': 10, 'weight': 2}
    ]

    cur.execute('INSERT INTO assessment_templates (name, version, pass_score_threshold) VALUES (?, ?, ?)',
                ('Tier 1 Assessment', 1, 75))
    tpl_id = cur.lastrowid

    for idx, it in enumerate(sample_items):
        cur.execute('''INSERT INTO assessment_items (template_id, order_index, label, item_type, max_score, weight)
                       VALUES (?, ?, ?, ?, ?, ?)''', (tpl_id, idx, it['label'], it['item_type'], it['max_score'], it['weight']))

    _compute_template_weight(cur, tpl_id)
    conn.commit()
    cur.execute('SELECT * FROM assessment_templates WHERE id=?', (tpl_id,))
    tpl = cur.fetchone()
    cur.execute('SELECT * FROM assessment_items WHERE template_id=? ORDER BY order_index', (tpl_id,))
    items_rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({'message': 'created', 'template': _template_to_dict(tpl, items_rows)}), 201


@assessments_bp.route('/records/<int:record_id>/assessments', methods=['POST'])
def create_assessment(record_id):
    data = request.json or {}
    template_id = data.get('template_id')
    if not template_id:
        return jsonify({'error': 'template_id required'}), 400

    conn = _get_conn(); cur = conn.cursor()
    # Ensure record exists
    cur.execute('SELECT id FROM records WHERE id=?', (record_id,))
    if not cur.fetchone():
        conn.close(); return jsonify({'error': 'Record not found'}), 404
    # Ensure template exists
    cur.execute('SELECT id FROM assessment_templates WHERE id=?', (template_id,))
    if not cur.fetchone():
        conn.close(); return jsonify({'error': 'Template not found'}), 404

    cur.execute('''INSERT INTO assessments (record_id, template_id) VALUES (?, ?)''', (record_id, template_id))
    aid = cur.lastrowid
    conn.commit(); conn.close()
    return jsonify({'message': 'assessment created', 'assessment_id': aid}), 201


@assessments_bp.route('/records/<int:record_id>/assessments', methods=['GET'])
def list_record_assessments(record_id):
    conn = _get_conn(); cur = conn.cursor()
    cur.execute('SELECT id FROM records WHERE id=?', (record_id,))
    if not cur.fetchone():
        conn.close(); return jsonify({'error': 'Record not found'}), 404
    cur.execute('''SELECT a.*, t.name AS template_name FROM assessments a
                   JOIN assessment_templates t ON t.id = a.template_id
                   WHERE a.record_id=? ORDER BY a.id DESC''', (record_id,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close(); return jsonify(rows)


@assessments_bp.route('/assessments/<int:assessment_id>', methods=['GET'])
def get_assessment(assessment_id):
    conn = _get_conn(); cur = conn.cursor()
    cur.execute('''SELECT a.*, t.name AS template_name, t.pass_score_threshold, t.total_weight
                   FROM assessments a JOIN assessment_templates t ON t.id=a.template_id
                   WHERE a.id=?''', (assessment_id,))
    a = cur.fetchone()
    if not a:
        conn.close(); return jsonify({'error': 'Assessment not found'}), 404
    cur.execute('''SELECT i.*, r.value_text, r.numeric_score
                   FROM assessment_items i
                   LEFT JOIN assessment_responses r ON r.item_id = i.id AND r.assessment_id=?
                   WHERE i.template_id=? ORDER BY i.order_index''', (assessment_id, a['template_id']))
    items = [dict(r) for r in cur.fetchall()]
    conn.close()
    return jsonify({'assessment': dict(a), 'items': items})


@assessments_bp.route('/assessments/<int:assessment_id>/responses', methods=['POST'])
def submit_responses(assessment_id):
    data = request.json or {}
    responses = data.get('responses')
    if not isinstance(responses, list):
        return jsonify({'error': 'responses must be a list'}), 400

    conn = _get_conn(); cur = conn.cursor()
    # Load assessment + template info
    cur.execute('''SELECT a.*, t.pass_score_threshold, t.total_weight FROM assessments a
                   JOIN assessment_templates t ON t.id=a.template_id WHERE a.id=?''', (assessment_id,))
    a = cur.fetchone()
    if not a:
        conn.close(); return jsonify({'error': 'Assessment not found'}), 404

    # Fetch items
    cur.execute('SELECT * FROM assessment_items WHERE template_id=?', (a['template_id'],))
    items_map = {row['id']: row for row in cur.fetchall()}

    total_weighted = 0.0
    max_weighted = 0.0

    # Collect per-response errors for detailed feedback
    response_errors = []

    for resp in responses:
        item_id = resp.get('item_id')
        value = resp.get('value')  # could be boolean/numeric/text
        if item_id not in items_map:
            response_errors.append(f'item_id {item_id} not in template')
            continue
        item = items_map[item_id]
        if item['item_type'] not in ALLOWED_ITEM_TYPES:
            response_errors.append(f'item_id {item_id} has unsupported type {item["item_type"]}')
            continue
        numeric_score = 0
        if item['item_type'] == 'boolean':
            truthy = str(value).lower() in ('1','true','yes','y','on')
            numeric_score = item['max_score'] if truthy else 0
        elif item['item_type'] == 'score':
            try:
                numeric_score = float(value)
            except Exception:
                response_errors.append(f'item_id {item_id} score not numeric; defaulted to 0')
                numeric_score = 0
            if numeric_score < 0:
                response_errors.append(f'item_id {item_id} score < 0 truncated to 0')
                numeric_score = 0
            if numeric_score > item['max_score']:
                response_errors.append(f'item_id {item_id} score > max truncated to max')
                numeric_score = item['max_score']
        else:  # text
            # no scoring impact; numeric_score remains 0
            pass

        # Upsert response (idempotent pattern: delete then insert)
        cur.execute('DELETE FROM assessment_responses WHERE assessment_id=? AND item_id=?', (assessment_id, item_id))
        cur.execute('''INSERT INTO assessment_responses (assessment_id, item_id, value_text, numeric_score)
                       VALUES (?, ?, ?, ?)''', (assessment_id, item_id, str(value), numeric_score))

        weight = item['weight'] or 1
        max_weighted += item['max_score'] * weight
        total_weighted += numeric_score * weight

    # Compute pass/fail
    percent = (total_weighted / max_weighted * 100) if max_weighted > 0 else 0
    passed = 1 if percent >= a['pass_score_threshold'] else 0

    cur.execute('''UPDATE assessments SET total_score=?, max_score=?, passed=?, completed_at=? WHERE id=?''',
                (total_weighted, max_weighted, passed, datetime.datetime.utcnow().isoformat(), assessment_id))

    conn.commit()
    conn.close()

    return jsonify({'message': 'responses saved', 'total_score': total_weighted, 'max_score': max_weighted, 'percent': percent, 'passed': bool(passed), 'warnings': response_errors})
