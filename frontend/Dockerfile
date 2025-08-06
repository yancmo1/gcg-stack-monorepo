# Frontend Dockerfile
FROM node:20
WORKDIR /app

# Install only dependencies based on lock file to ensure deterministic installs
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy the rest of the app source
COPY . .

# Build the app
RUN npm run build

# Expose and run preview server
EXPOSE 6002
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "6002"]
