# models.py
# Define database schema and helper functions
import sqlite3
import os

DATABASE = os.path.join(os.path.dirname(__file__), 'database.db')

def init_db():
    conn = sqlite3.connect(DATABASE)
    cur = conn.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS records (
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
        new_hire_test_score REAL
    )''')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
