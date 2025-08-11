# Render Deployment Guide for Training LMS

## Backend (Flask)
- Docker build context: `training-lms/backend`
- Dockerfile path: `training-lms/backend/Dockerfile`
- Expose port: 6001
- Environment variables to set in Render dashboard:
  - `DATABASE_URL` (your Postgres URL)
  - `FLASK_ENV=production`
  - `SECRET_KEY` (any random string)

## Frontend (React/Vite)
- Docker build context: `training-lms/frontend`
- Dockerfile path: `training-lms/frontend/Dockerfile`
- Expose port: 6002
- Environment variable to set in Render dashboard:
  - `REACT_APP_API_BASE` (set to your backend’s Render URL, e.g., `https://your-backend.onrender.com/api`)

## Steps
1. Push your code to GitHub.
2. In Render, create a new Web Service for backend and frontend, using the above settings.
3. Set environment variables in the Render dashboard for each service.
4. Deploy and test your app online!

## Troubleshooting
- If you see CORS errors, make sure your backend allows requests from your frontend’s Render domain.
- For persistent data, always use Postgres (not SQLite) in production.
- You can update environment variables and redeploy from the Render dashboard.
