# db.py
# SQLAlchemy setup for Postgres
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Try different connection strings based on your system
POSTGRES_URL = os.getenv('DATABASE_URL', 'postgresql://yancyshepherd@localhost:5432/training_lms')
engine = create_engine(POSTGRES_URL, echo=False, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
