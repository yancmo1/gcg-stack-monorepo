#!/bin/bash
echo "Initializing database..."
python3 docker_init.py
echo "Starting Flask application..."
exec gunicorn -b 0.0.0.0:6001 app_pg:app
