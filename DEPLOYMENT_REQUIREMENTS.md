# Training LMS - IT Deployment Requirements

## Overview
This document outlines the complete technical requirements for deploying the Training Learning Management System (LMS) in a production environment.

## System Architecture
- **Frontend**: React 19 with Vite build system
- **Backend**: Python Flask REST API
- **Database**: PostgreSQL 15 (production) / SQLite (development)
- **Reverse Proxy**: Nginx
- **Containerization**: Docker with Docker Compose orchestration

## Server Requirements

### Minimum Hardware Specifications
- **CPU**: 2 cores (4 recommended for production)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB minimum (50GB+ recommended for data growth)
- **Network**: 1Gbps connection recommended

### Operating System
- Linux (Ubuntu 22.04 LTS recommended)
- CentOS/RHEL 8+
- Windows Server 2019+ (with Docker Desktop)
- macOS 12+ (development only)

## Required Software Components

### Docker Environment
```bash
# Docker Engine 24.0+
docker --version

# Docker Compose 2.20+
docker-compose --version
```

### Network Ports
| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend | 6002 | HTTP | Web application access |
| Backend API | 6001 | HTTP | Internal API communication |
| PostgreSQL | 5433 | TCP | Database connection (external access) |
| PostgreSQL Internal | 5432 | TCP | Container-to-container DB communication |

### Storage Requirements
- **Database Volume**: `lms_pg_data` - PostgreSQL persistent data
- **Application Data**: `./Original Docs data and example` - Document storage
- **Logs**: Application and container logs (~1GB/month estimated)

## Technology Stack Details

### Frontend Dependencies
- **React**: 19.0.0 (Component framework)
- **React Router**: 7.0.0 (Client-side routing)
- **Vite**: 5.4.2 (Build tool and development server)
- **Chart.js**: 4.4.1 (Analytics dashboard charts)
- **TanStack Query**: 4.36.1 (Data fetching and caching)
- **React Icons**: 5.0.1 (Icon library)
- **Node.js**: 20+ (Build environment)

### Backend Dependencies
- **Python**: 3.11+
- **Flask**: 3.0.0 (Web framework)
- **Werkzeug**: 3.0.1 (WSGI utilities, password hashing)
- **psycopg2**: 2.9.9 (PostgreSQL adapter)
- **python-dotenv**: 1.0.0 (Environment configuration)

### Database
- **PostgreSQL**: 15.0 (Primary production database)
- **SQLite**: 3.0+ (Development/testing fallback)

### Infrastructure
- **Nginx**: Latest stable (Reverse proxy and static file serving)
- **Docker**: 24.0+ (Containerization)
- **Docker Compose**: 2.20+ (Multi-container orchestration)

## Environment Configuration

### Production Environment Variables
```bash
# Backend Configuration
FLASK_ENV=production
PORT=6001
DATABASE_URL=postgresql://lms_user:lms_pass_2025@lms-postgres:5432/lms_db
SEED_ON_START=true
DATA_DIR=/data

# Frontend Configuration  
REACT_APP_API_BASE=http://localhost:6001/api
```

### Database Configuration
```sql
-- PostgreSQL Database Setup
Database: lms_db
Username: lms_user
Password: lms_pass_2025
Port: 5433 (external), 5432 (internal)
```

## Security Considerations

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (Admin, User roles)
- Password hashing using Werkzeug security
- Session management via localStorage

### Network Security
- Internal container networking for database access
- Only necessary ports exposed to host
- Environment-based configuration for sensitive data

### Data Protection
- PostgreSQL persistent volumes for data durability
- Backup recommendations: Daily database dumps
- Log rotation to prevent disk space issues

## Deployment Steps

### 1. Production Deployment
```bash
# Clone repository
git clone <repository-url>
cd training-lms

# Deploy with production configuration
docker-compose up --build -d

# Verify services
docker-compose ps
docker-compose logs
```

### 2. Development Deployment
```bash
# Deploy with development configuration (SQLite + hot reloading)
docker-compose -f docker-compose.dev.yml up --build
```

### 3. Health Checks
- Frontend: http://localhost:6002
- Backend API: http://localhost:6001/api/health
- Database: Connection via port 5433

## Monitoring & Maintenance

### Log Locations
- Container logs: `docker-compose logs [service-name]`
- Application logs: Stored in container `/app/logs`
- Database logs: PostgreSQL container logs

### Backup Strategy
```bash
# Database backup
docker exec training-lms-lms-postgres-1 pg_dump -U lms_user lms_db > backup_$(date +%Y%m%d).sql

# Data directory backup
tar -czf data_backup_$(date +%Y%m%d).tar.gz "./Original Docs data and example"
```

### Updates & Maintenance
- Container updates: `docker-compose pull && docker-compose up --build -d`
- Database migrations: Handled automatically by Flask application
- Log rotation: Configure with system logrotate or Docker logging driver

## Troubleshooting Guide

### Common Issues
1. **Port Conflicts**: Ensure ports 6001, 6002, 5433 are available
2. **Database Connection**: Verify PostgreSQL container is running and accessible
3. **Frontend Build Issues**: Check Node.js version compatibility (20+)
4. **Memory Issues**: Monitor container memory usage, increase VM resources if needed

### Support Information
- Application logs for debugging
- Container resource monitoring
- Database performance metrics
- Network connectivity verification

## Development vs Production Differences

| Aspect | Development | Production |
|--------|-------------|------------|
| Database | SQLite | PostgreSQL |
| Hot Reloading | Enabled | Disabled |
| Build Optimization | Development | Production optimized |
| Volume Mounting | Source code mounted | Built containers only |
| Nginx | Not used | Reverse proxy enabled |

---

**Contact Information**
- Technical Support: yancyshepherd@gcgmail.com
- Repository: [Git Repository URL]
- Documentation: This file and README.md files in project

**Last Updated**: [Current Date]
**Version**: 1.0 (Beta Ready)