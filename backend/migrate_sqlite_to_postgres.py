"""Simple migration script to copy data from SQLite (database.db) to Postgres (training_lms).
Run inside the backend container where psql is reachable, or from host with proper env.
"""
import sqlite3
import psycopg2
import os

SQLITE_DB = os.getenv('SQLITE_DB', '/app/database.db')
PG_CONN = os.getenv('PG_CONN', 'dbname=training_lms user=postgres password=password host=training-lms-postgres')

print('Connecting to SQLite:', SQLITE_DB)
sql_conn = sqlite3.connect(SQLITE_DB)
sql_conn.row_factory = sqlite3.Row
sql_cur = sql_conn.cursor()

print('Connecting to Postgres')
pg_conn = psycopg2.connect(PG_CONN)
pg_cur = pg_conn.cursor()

# Ensure destination tables exist: departments, users, records, tests
pg_cur.execute("CREATE TABLE IF NOT EXISTS departments (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT now());")
pg_cur.execute("CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT, department_id INTEGER, created_at TIMESTAMP DEFAULT now());")
pg_cur.execute("CREATE TABLE IF NOT EXISTS records (id SERIAL PRIMARY KEY, employee_name TEXT, title TEXT, region TEXT, start_date DATE, completion_date DATE, status TEXT, sort_order INTEGER, notes TEXT, trainer TEXT, mtl_completed TEXT, new_hire_test_score TEXT, \"group\" TEXT DEFAULT 'Learner');")
pg_cur.execute("CREATE TABLE IF NOT EXISTS tests (id SERIAL PRIMARY KEY, record_id INTEGER REFERENCES records(id) ON DELETE CASCADE, test_type TEXT, test_date DATE, score INTEGER, passed INTEGER, notes TEXT, created_at TIMESTAMP DEFAULT now());")
pg_conn.commit()

# Migrate departments
sql_cur.execute('SELECT id, name, description, created_at FROM departments')
deps = sql_cur.fetchall()
print('Departments to migrate:', len(deps))
for d in deps:
    pg_cur.execute('INSERT INTO departments (id, name, description, created_at) VALUES (%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING', (d['id'], d['name'], d['description'], d['created_at']))
pg_conn.commit()

# Migrate users
sql_cur.execute('SELECT id, username, password_hash, role, department_id, created_at FROM users')
users = sql_cur.fetchall()
print('Users to migrate:', len(users))
for u in users:
    pg_cur.execute('INSERT INTO users (id, username, password_hash, role, department_id, created_at) VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING', (u['id'], u['username'], u['password_hash'], u['role'], u['department_id'], u['created_at']))
pg_conn.commit()

# Migrate records
sql_cur.execute('SELECT id, employee_name, title, region, start_date, completion_date, status, sort_order, notes, trainer, mtl_completed, new_hire_test_score, "group" FROM records')
recs = sql_cur.fetchall()
print('Records to migrate:', len(recs))
for r in recs:
    # Normalize empty strings to None for date/integer fields
    start_date = r['start_date'] if r['start_date'] and r['start_date'].strip() else None
    completion_date = r['completion_date'] if r['completion_date'] and r['completion_date'].strip() else None
    sort_order = r['sort_order'] if r['sort_order'] is not None and str(r['sort_order']).strip() != '' else None
    group_val = r['group'] if r['group'] is not None else 'Learner'
    pg_cur.execute('INSERT INTO records (id, employee_name, title, region, start_date, completion_date, status, sort_order, notes, trainer, mtl_completed, new_hire_test_score, "group") VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING', (r['id'], r['employee_name'], r['title'], r['region'], start_date, completion_date, r['status'], sort_order, r['notes'], r['trainer'], r['mtl_completed'], r['new_hire_test_score'], group_val))
pg_conn.commit()

# Migrate tests
sql_cur.execute('SELECT id, record_id, test_type, test_date, score, passed, notes, created_at FROM tests')
tests = sql_cur.fetchall()
print('Tests to migrate:', len(tests))
for t in tests:
    # Normalize test_date and numeric fields
    test_date = t['test_date'] if t['test_date'] and t['test_date'].strip() and t['test_date'].strip().upper() not in ('TBA','N/A','') else None
    score = int(t['score']) if t['score'] is not None and str(t['score']).strip() != '' else None
    passed = int(t['passed']) if t['passed'] is not None and str(t['passed']).strip() != '' else None
    pg_cur.execute('INSERT INTO tests (id, record_id, test_type, test_date, score, passed, notes, created_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING', (t['id'], t['record_id'], t['test_type'], test_date, score, passed, t['notes'], t['created_at']))
pg_conn.commit()

print('Migration complete')

pg_cur.close()
pg_conn.close()
sql_conn.close()
