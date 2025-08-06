# import_learners_csv.py
import csv
from datetime import datetime
from db import SessionLocal
from models_pg import Learner
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), '../Original Docs data and example/Training LMS Tracker(Tracker) (1).csv')

def parse_date(s):
    if not s or not s.strip():
        return None
    for fmt in ('%m/%d/%Y', '%m/%d/%y', '%Y-%m-%d'):
        try:
            return datetime.strptime(s.strip(), fmt).date()
        except Exception:
            continue
    return None

def main():
    db = SessionLocal()
    with open(CSV_PATH, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            learner = Learner(
                employee_name=row['Employee Name'].strip(),
                title=row['Title'].strip(),
                region=row['Region'].strip(),
                start_date=parse_date(row['Start Date']),
                completion_date=parse_date(row['Completion Date']),
                status=row['Status'].strip(),
                sort_order=int(row['Sort Order']) if row['Sort Order'] else None,
                notes=row['Notes'].strip(),
                trainer=row['Trainer'].strip(),
                mtl_completed=row['MTL Completed'].strip(),
                new_hire_test_score=float(row['New Hire Test Score']) if row['New Hire Test Score'] else None
            )
            db.add(learner)
        db.commit()
    db.close()
    print('Imported learners from CSV.')

if __name__ == '__main__':
    main()
