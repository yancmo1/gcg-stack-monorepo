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

### Running with Docker
1. Build and start both backend and frontend:
   ```zsh
   docker-compose up --build
   ```
2. Backend API: http://localhost:6001/api/records
3. Frontend: http://localhost:6002

### Local Development (without Docker)
#### Backend
```zsh
cd backend
python models.py  # Initialize DB
pip install -r requirements.txt
python app.py
```
#### Frontend
```zsh
cd frontend
npm install
npm run dev -- --port 6002
```

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
