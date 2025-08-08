# Use the official Nginx image
FROM nginx:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend files
COPY ../frontend/dist /usr/share/nginx/html

EXPOSE 6002
