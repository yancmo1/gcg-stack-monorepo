# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install dependencies first for better caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY . .

ENV FLASK_ENV=production
# DATABASE_URL will be set in Render dashboard

EXPOSE 6001

CMD ["gunicorn", "-b", "0.0.0.0:6001", "app_pg:app"]
