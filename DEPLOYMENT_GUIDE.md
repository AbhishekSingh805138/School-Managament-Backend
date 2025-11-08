# School Management System - Complete Deployment Guide

## System Overview

### Backend (Node.js/Express/PostgreSQL)
- **Location**: Root directory
- **Port**: 3000
- **Database**: PostgreSQL
- **Cache**: Redis (optional)
- **API Version**: v1

### Frontend (Angular 19)
- **Location**: `school-management-frontend/`
- **Port**: 4200 (development)
- **Framework**: Angular 19.2
- **UI Library**: Angular Material 19.2

## Prerequisites

### Required Software
- Node.js v18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher (optional but recommended)
- npm or yarn
- Git

### Development Tools
- Angular CLI: `npm install -g @angular/cli`
- TypeScript: Included in project
- VS Code or preferred IDE

## Backend Deployment

### 1. Database Setup

```bash
# Install PostgreSQL (if not installed)
# Windows: Download from postgresql.org
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
psql -U postgres
CREATE DATABASE SMS;
\q
```

### 2. Environment Configuration

Create `.env` file in root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SMS
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Seed Database (Optional)

```bash
npm run seed
```

### 6. Start Backend Server

```bash
# Development
npm run dev

# Production
npm start
```

Backend should be running at `http://localhost:3000`

## Frontend Deployment

### 1. Navigate to Frontend Directory

```bash
cd school-management-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

**Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api/v1'
};
```

### 4. Start Development Server

```bash
npm start
# or
ng serve
```

Frontend should be running at `http://localhost:4200`

### 5. Build for Production

```bash
npm run build
# or
ng build --configuration production
```

Build output will be in `dist/school-management-frontend/`

## Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

#### Backend Deployment

1. **Install Node.js and PostgreSQL on server**

2. **Clone repository**
```bash
git clone <repository-url>
cd school-management-system
```

3. **Install dependencies**
```bash
npm install --production
```

4. **Configure environment**
```bash
cp .env.example .env
nano .env  # Edit with production values
```

5. **Run migrations**
```bash
npm run migrate
```

6. **Use PM2 for process management**
```bash
npm install -g pm2
pm2 start src/index.js --name school-api
pm2 save
pm2 startup
```

7. **Configure Nginx as reverse proxy**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Frontend Deployment

1. **Build the application**
```bash
cd school-management-frontend
npm run build
```

2. **Copy build files to server**
```bash
scp -r dist/school-management-frontend/* user@server:/var/www/school-frontend/
```

3. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/school-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

4. **Enable HTTPS with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Option 2: Docker Deployment

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/school-management-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: SMS
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./school-management-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

### Option 3: Cloud Deployment

#### AWS Deployment

**Backend (Elastic Beanstalk)**:
1. Install AWS CLI and EB CLI
2. Initialize EB application
3. Deploy:
```bash
eb init
eb create school-api-env
eb deploy
```

**Frontend (S3 + CloudFront)**:
1. Build application
2. Create S3 bucket
3. Upload files:
```bash
aws s3 sync dist/school-management-frontend/ s3://your-bucket-name/
```
4. Configure CloudFront distribution
5. Set up custom domain

**Database (RDS)**:
1. Create PostgreSQL RDS instance
2. Update backend environment variables
3. Run migrations

#### Heroku Deployment

**Backend**:
```bash
heroku create school-api
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
heroku run npm run migrate
```

**Frontend (Netlify/Vercel)**:
1. Connect GitHub repository
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist/school-management-frontend`
3. Set environment variables
4. Deploy

## Post-Deployment Checklist

### Backend
- [ ] Database is accessible
- [ ] Migrations are complete
- [ ] Environment variables are set
- [ ] API is responding at `/api/v1/health`
- [ ] CORS is configured correctly
- [ ] SSL/HTTPS is enabled
- [ ] Rate limiting is working
- [ ] Error logging is configured
- [ ] Backup strategy is in place

### Frontend
- [ ] Application loads without errors
- [ ] API URL is correct
- [ ] Authentication works
- [ ] All routes are accessible
- [ ] Assets load correctly
- [ ] HTTPS is enabled
- [ ] Gzip compression is enabled
- [ ] CDN is configured (if applicable)
- [ ] Analytics are set up (if applicable)

### Security
- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable HTTPS everywhere
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS only for trusted origins
- [ ] Regular security updates
- [ ] Backup encryption

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging
- [ ] Set up uptime monitoring
- [ ] Configure alerts
- [ ] Monitor database performance
- [ ] Monitor API response times

## Maintenance

### Regular Tasks
- **Daily**: Check error logs
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

### Backup Strategy
```bash
# Database backup
pg_dump -U postgres SMS > backup_$(date +%Y%m%d).sql

# Automated daily backups
0 2 * * * /usr/bin/pg_dump -U postgres SMS > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Updates
```bash
# Backend updates
npm update
npm audit fix

# Frontend updates
cd school-management-frontend
npm update
npm audit fix
```

## Troubleshooting

### Backend Issues

**Database Connection Failed**:
- Check PostgreSQL is running
- Verify credentials in `.env`
- Check firewall rules

**Port Already in Use**:
```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Frontend Issues

**API Connection Failed**:
- Verify backend is running
- Check API URL in environment file
- Check CORS configuration

**Build Errors**:
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Support and Documentation

- **API Documentation**: `/api/v1/docs` (if Swagger is configured)
- **Postman Collection**: `School_Management_API_Postman_Collection.json`
- **Integration Guide**: `API_INTEGRATION_GUIDE.md`
- **Test Checklist**: `INTEGRATION_TEST_CHECKLIST.md`

## Success Criteria

✅ Backend API is accessible and responding
✅ Frontend application loads without errors
✅ Users can log in successfully
✅ All CRUD operations work
✅ Role-based access control functions correctly
✅ Data persists correctly in database
✅ Error handling works as expected
✅ Application is secure (HTTPS, authentication)
✅ Performance is acceptable (< 3s load time)
✅ Application is responsive on all devices

## Conclusion

The School Management System is now fully deployed and ready for use. Regular monitoring and maintenance will ensure optimal performance and security.

For issues or questions, refer to the documentation or contact the development team.
