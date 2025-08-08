# models_pg.py
from sqlalchemy import Column, Integer, String, Float, Date, Text
from db import Base


class Learner(Base):
    __tablename__ = 'learners'
    id = Column(Integer, primary_key=True, index=True)
    employee_name = Column(String, nullable=False, unique=True)  # Add unique constraint
    title = Column(String)
    region = Column(String)
    start_date = Column(Date)
    completion_date = Column(Date)
    status = Column(String)
    sort_order = Column(Integer)
    notes = Column(Text)
    trainer = Column(String)
    mtl_completed = Column(String)
    new_hire_test_score = Column(Float)
    group = Column(String, default='Learner')  # New field: 'Learner' or 'Testing'
