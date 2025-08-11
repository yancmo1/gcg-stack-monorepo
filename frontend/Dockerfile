# Frontend Dockerfile
FROM node:20-slim
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Expose and run preview server
EXPOSE 6002
CMD ["npm", "run", "preview", "--", "--host", "--port", "6002"]
