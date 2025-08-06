#!/usr/bin/env python3
# docker_init.py - Initialize database and import data when running in Docker

import os
import time
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

def wait_for_postgres(max_retries=30):
    """Wait for PostgreSQL to be ready"""
    postgres_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@postgres:5432/training_lms')
    
    for i in range(max_retries):
        try:
            engine = create_engine(postgres_url)
            with engine.connect() as conn:
                conn.execute(text('SELECT 1'))
            print("PostgreSQL is ready!")
            return engine
        except OperationalError as e:
            print(f"Waiting for PostgreSQL... ({i+1}/{max_retries})")
            time.sleep(2)
    
    raise Exception("PostgreSQL not available after maximum retries")

def init_database():
    """Initialize database tables and import data"""
    try:
        engine = wait_for_postgres()
        
        # Import and create tables
        from db import Base
        from models_pg import Learner
        
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Import CSV data if file exists
        csv_path = '/data/Training LMS Tracker(Tracker) (1).csv'
        if os.path.exists(csv_path):
            print("Importing learner data from CSV...")
            
            import pandas as pd
            from db import SessionLocal
            
            # Read CSV
            df = pd.read_csv(csv_path)
            
            # Clean and prepare data
            df.columns = df.columns.str.strip()
            df = df.dropna(subset=['Employee Name']).head(50)  # Limit to 50 records
            
            # Import to database
            db = SessionLocal()
            try:
                for _, row in df.iterrows():
                    employee_name = str(row.get('Employee Name', '')).strip()
                    # Skip if learner with this employee_name already exists
                    exists = db.query(Learner).filter_by(employee_name=employee_name).first()
                    if exists:
                        continue
                    learner = Learner(
                        employee_name=employee_name,
                        title=str(row.get('Title', '')).strip() if pd.notna(row.get('Title')) else None,
                        region=str(row.get('Region', '')).strip() if pd.notna(row.get('Region')) else None,
                        start_date=pd.to_datetime(row.get('Start Date', ''), errors='coerce').date() if pd.notna(row.get('Start Date')) and str(row.get('Start Date')).strip() else None,
                        completion_date=pd.to_datetime(row.get('Completion Date', ''), errors='coerce').date() if pd.notna(row.get('Completion Date')) and str(row.get('Completion Date')).strip() else None,
                        status=str(row.get('Status', 'Pending')).strip(),
                        sort_order=int(row.get('Sort Order', 0)) if pd.notna(row.get('Sort Order')) else 0,
                        notes=str(row.get('Notes', '')).strip() if pd.notna(row.get('Notes')) else None,
                        trainer=str(row.get('Trainer', '')).strip() if pd.notna(row.get('Trainer')) else None,
                        mtl_completed=str(row.get('MTL Completed', '')).strip() if pd.notna(row.get('MTL Completed')) else None,
                        new_hire_test_score=float(row.get('New Hire Test Score', 0)) if pd.notna(row.get('New Hire Test Score')) else None
                    )
                    db.add(learner)
                db.commit()
                count = db.query(Learner).count()
                print(f"Successfully imported {count} learners")
            finally:
                db.close()
        else:
            print("No CSV file found at /data/Training LMS Tracker(Tracker) (1).csv")
        
        print("Database initialization complete!")
        
    except Exception as e:
        print(f"Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
