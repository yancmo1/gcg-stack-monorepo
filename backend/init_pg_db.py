# init_pg_db.py
from db import engine, Base
import models_pg

if __name__ == '__main__':
    print('Creating Postgres tables...')
    Base.metadata.create_all(bind=engine)
    print('Done.')
