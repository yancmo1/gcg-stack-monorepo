# Root Dockerfile for training-lms (Render-compatible, multi-service)

# --- Frontend build stage ---
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/. .
RUN npm run build

# --- Backend build stage ---
FROM python:3.11-slim AS backend-build
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/. .

# --- Final stage ---
FROM python:3.11-slim
WORKDIR /app

# Copy backend from build stage
COPY --from=backend-build /app/backend /app/backend

# Copy frontend build output
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Install backend dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Expose backend and frontend ports
EXPOSE 6001
EXPOSE 6002

# Start both backend and frontend preview server
CMD ["sh", "-c", "cd /app/backend && gunicorn -b 0.0.0.0:6001 app_pg:app & cd /app/frontend && npm run preview -- --host --port 6002"]
