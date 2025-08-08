# Training LMS Tracker

A web-based Training LMS Tracker with a Python Flask backend (SQLite) and React frontend. Includes Docker support, CSV import/export, and manual data entry.

## Features
- Add, edit, delete training records
- CSV import/export
- Responsive, modern UI
- REST API backend
- Dockerized for easy deployment

## Getting Started

### Prerequisites
- Docker & Docker Compose installed


### Running in Production (with Nginx)
1. Build and start all services (backend, frontend, Nginx, Postgres):
   ```zsh
   docker-compose up --build
   ```
2. Access the app at: http://localhost:6002
   - All API requests are proxied to the backend via Nginx.
   - Nginx serves the built frontend and proxies `/api/` to the backend.

### Running in Development (with Hot Reloading)
Use the dev compose file to run backend and frontend with hot reloading (no Nginx):
```zsh
docker-compose -f docker-compose.dev.yml up --build
```
Or run backend and frontend manually as before:


### Local Development (without Docker)

#### Backend (manual dev)
```zsh
cd backend
python models.py  # Initialize DB
pip install -r requirements.txt
python app.py
```

#### Frontend (manual dev)
```zsh
cd frontend
npm install
npm run dev -- --port 6002
```

### Environment Variables
- Backend: see `backend/.env`
- Frontend: see `frontend/.env`

### Nginx
- Production Nginx config is in `nginx/nginx.conf` and used by the Docker Compose setup.

## Usage
- Open the frontend in your browser (http://localhost:6002)
- Add new records using the form
- View all records in the table

## Notes
- For CSV import/export, future enhancements will be added.
- Authentication and Active Directory integration are planned for future versions.

## Next Steps for Testing
- Verify Docker installation and troubleshoot any issues.
- Test API endpoints using Postman or curl.
- Validate CSV import/export functionality.
- Check mobile responsiveness and UI/UX consistency.
