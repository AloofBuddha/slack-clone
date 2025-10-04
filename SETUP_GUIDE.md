# Slack Clone - Complete Setup Guide

This guide will walk you through setting up the Slack clone on your local machine and deploying it to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Environment Variables](#environment-variables)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Docker** and **Docker Compose** (for local database)
- **Git**

## Local Development Setup

### Step 1: Clone and Setup

```bash
# Navigate to project
cd slack-clone

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Start Infrastructure Services

```bash
# From the root directory
docker-compose up -d

# This will start:
# - PostgreSQL on port 5432
# - Redis on port 6379
```

### Step 3: Configure Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# The defaults should work for local development
```

**Backend .env file:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/slack_clone
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Step 4: Initialize Database

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### Step 5: Start Backend Server

```bash
cd backend
npm run dev

# Server will start on http://localhost:3000
# API documentation: http://localhost:3000/api
```

### Step 6: Configure Frontend

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Edit .env if needed (defaults should work)
```

**Frontend .env file:**
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### Step 7: Start Frontend Server

```bash
cd frontend
npm run dev

# Frontend will start on http://localhost:5173
```

### Step 8: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Prisma Studio**: http://localhost:5555 (if running)

## Production Deployment

### Option 1: Railway + Vercel (Recommended)

#### Deploy Backend to Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Railway Project**
```bash
cd backend
railway init
```

4. **Add PostgreSQL**
```bash
railway add --plugin postgresql
```

5. **Add Redis**
```bash
railway add --plugin redis
```

6. **Set Environment Variables**

Go to Railway dashboard and add:
```
JWT_SECRET=<generate-secure-random-string>
JWT_REFRESH_SECRET=<generate-secure-random-string>
CORS_ORIGIN=<your-vercel-frontend-url>
NODE_ENV=production
```

Railway automatically provides:
- `DATABASE_URL` (from PostgreSQL plugin)
- `REDIS_URL` (from Redis plugin)

7. **Deploy Backend**
```bash
railway up
```

8. **Run Database Migrations**
```bash
railway run npm run prisma:deploy
```

#### Deploy Frontend to Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy Frontend**
```bash
cd frontend
vercel

# Follow prompts
# Set environment variables when asked:
# VITE_API_URL=<your-railway-backend-url>
# VITE_WS_URL=<your-railway-backend-url>
```

3. **Configure Vercel Environment Variables**

Go to Vercel dashboard → Project Settings → Environment Variables:
```
VITE_API_URL=https://your-backend.railway.app
VITE_WS_URL=https://your-backend.railway.app
```

4. **Redeploy**
```bash
vercel --prod
```

### Option 2: Docker Deployment

#### Build Docker Images

```bash
# Build backend
cd backend
docker build -t slack-clone-backend .

# Build frontend (create Dockerfile first)
cd frontend
docker build -t slack-clone-frontend .
```

#### Deploy with Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: slack_clone
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    image: slack-clone-backend
    environment:
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/slack_clone
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      CORS_ORIGIN: ${FRONTEND_URL}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  frontend:
    image: slack-clone-frontend
    environment:
      VITE_API_URL: ${BACKEND_URL}
      VITE_WS_URL: ${BACKEND_URL}
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

## Environment Variables

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for access tokens | `random-64-char-string` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | `random-64-char-string` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `NODE_ENV` | Environment | `development` or `production` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_WS_URL` | WebSocket server URL | `http://localhost:3000` |

## Generating Secure Secrets

For production, generate secure random strings for JWT secrets:

```bash
# On Linux/Mac
openssl rand -base64 64

# On Windows (PowerShell)
[Convert]::ToBase64String((1..64 | ForEach-Object {Get-Random -Maximum 256}))

# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

## Database Migrations

### Create New Migration

```bash
cd backend
npm run prisma:migrate -- --name your_migration_name
```

### Apply Migrations in Production

```bash
# Railway
railway run npm run prisma:deploy

# Or manually
npm run prisma:deploy
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Problem**: `Error: P1001: Can't reach database server`

**Solution**:
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL is correct
- Verify network connectivity

#### 2. WebSocket Connection Failed

**Problem**: WebSocket fails to connect

**Solution**:
- Ensure CORS_ORIGIN includes your frontend URL
- Check that WebSocket URL matches backend URL
- Verify no firewall blocking WebSocket connections

#### 3. JWT Token Errors

**Problem**: `Error: Invalid token`

**Solution**:
- Clear browser localStorage
- Ensure JWT_SECRET is consistent across deployments
- Check token expiration settings

#### 4. Prisma Client Not Generated

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
npm run prisma:generate
```

#### 5. Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Health Checks

#### Backend Health Check

```bash
curl http://localhost:3000/api/auth/me
```

#### Database Connection

```bash
cd backend
npm run prisma:studio
```

#### Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

## Performance Optimization

### Backend

1. **Enable Redis caching** for frequently accessed data
2. **Add database indexes** for common queries
3. **Implement rate limiting** (already configured)
4. **Use connection pooling** (Prisma handles this)

### Frontend

1. **Enable production build**:
```bash
npm run build
npm run preview
```

2. **Optimize bundle size**:
- Use code splitting
- Lazy load routes
- Tree-shake unused code

3. **Enable CDN** for static assets (Vercel does this automatically)

## Monitoring

### Recommended Tools

- **Backend**: Railway logs, DataDog, Sentry
- **Frontend**: Vercel Analytics, Google Analytics
- **Database**: Railway metrics, PgAdmin
- **Errors**: Sentry for both frontend and backend

## Scaling

### Horizontal Scaling

The application is designed to scale horizontally:

1. **Multiple backend instances**: Socket.io uses Redis adapter for cross-instance communication
2. **Database read replicas**: Configure in Prisma
3. **CDN**: Use Vercel or Cloudflare for frontend assets

### Vertical Scaling

Increase resources on Railway:
- RAM: 2GB → 4GB → 8GB
- CPU: 1 core → 2 cores → 4 cores

## Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Enable HTTPS in production
- [ ] Set secure CORS origins
- [ ] Enable rate limiting
- [ ] Use environment variables for all secrets
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Implement proper error logging
- [ ] Regular security updates

## Next Steps

1. **Customize**: Modify colors, branding, features
2. **Add features**: Direct messages, file uploads, search
3. **Integrate**: Add third-party services (email, analytics)
4. **Scale**: Implement caching, CDN, load balancing
5. **Monitor**: Set up logging, metrics, alerting

## Support

For issues and questions:
- Check this guide and README.md
- Review error logs in Railway/Vercel
- Check browser console for frontend errors
- Inspect network tab for API failures

## License

MIT License - feel free to use for any purpose
