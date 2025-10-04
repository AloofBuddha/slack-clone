# Quick Deployment Guide

## 🚀 Deploy to Production in 10 Minutes

### Prerequisites
- GitHub account (for code hosting)
- Railway account (for backend) - https://railway.app
- Vercel account (for frontend) - https://vercel.com

---

## Step 1: Push Code to GitHub

```bash
cd slack-clone
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

---

## Step 2: Deploy Backend on Railway

### 2.1 Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `slack-clone` repository
5. Select the `backend` folder as root

### 2.2 Add PostgreSQL Database

1. In your project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically set `DATABASE_URL` environment variable

### 2.3 Add Redis

1. Click "New" again
2. Select "Database" → "Redis"
3. Railway will automatically set `REDIS_URL` environment variable

### 2.4 Configure Environment Variables

In Railway dashboard, go to your backend service → Variables:

```env
JWT_SECRET=<paste-secure-random-64-char-string>
JWT_REFRESH_SECRET=<paste-secure-random-64-char-string>
CORS_ORIGIN=https://your-app.vercel.app
NODE_ENV=production
PORT=3000
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 2.5 Deploy Backend

1. Railway will automatically deploy
2. Wait for deployment to complete
3. Copy your Railway backend URL (e.g., `https://slack-clone-production.up.railway.app`)

### 2.6 Run Database Migrations

In Railway dashboard:
1. Go to your backend service
2. Click "Settings" → "Deploy Triggers"
3. Or use Railway CLI:

```bash
railway login
railway link
railway run npm run prisma:deploy
```

---

## Step 3: Deploy Frontend on Vercel

### 3.1 Import Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. **Important**: Set "Root Directory" to `frontend`

### 3.2 Configure Build Settings

Vercel should auto-detect Vite, but verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Set Environment Variables

Before deploying, add these variables:

```env
VITE_API_URL=https://your-railway-backend-url.railway.app
VITE_WS_URL=https://your-railway-backend-url.railway.app
```

### 3.4 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Your app will be live at `https://your-app.vercel.app`

### 3.5 Update Backend CORS

Go back to Railway → Backend Service → Variables:
- Update `CORS_ORIGIN` to your actual Vercel URL

Redeploy backend for changes to take effect.

---

## Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Register a new account
3. Create a workspace
4. Create a channel
5. Send messages and test real-time updates

---

## Alternative: One-Click Deployment

### Deploy Backend to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

### Deploy Frontend to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

---

## Cost Estimates

### Free Tier (Perfect for Testing)
- **Railway**: $5 credit/month (enough for small projects)
- **Vercel**: 100GB bandwidth, unlimited projects
- **Total**: $0-5/month

### Production (1000 concurrent users)
- **Railway**: ~$20-30/month (backend + PostgreSQL + Redis)
- **Vercel**: ~$20/month (Pro plan)
- **Total**: ~$40-50/month

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Auto-set | PostgreSQL connection (from Railway plugin) |
| `REDIS_URL` | Auto-set | Redis connection (from Railway plugin) |
| `JWT_SECRET` | **Yes** | Secret for access tokens (64+ chars) |
| `JWT_REFRESH_SECRET` | **Yes** | Secret for refresh tokens (64+ chars) |
| `CORS_ORIGIN` | **Yes** | Your Vercel frontend URL |
| `NODE_ENV` | **Yes** | Set to `production` |
| `PORT` | Optional | Defaults to 3000 |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Your Railway backend URL |
| `VITE_WS_URL` | **Yes** | Your Railway backend URL (same as API) |

---

## Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend.railway.app/api/auth/me`
- [ ] Frontend loads correctly
- [ ] Can register new account
- [ ] Can create workspace
- [ ] Can create channels
- [ ] Real-time messaging works
- [ ] WebSocket connection established
- [ ] User presence updates
- [ ] Reactions work
- [ ] Edit/delete messages work

---

## Troubleshooting

### Backend Issues

**Problem**: Railway build fails
- Check `package.json` for correct scripts
- Ensure `prisma generate` runs in build
- Check Railway logs for specific errors

**Problem**: Database connection fails
- Verify PostgreSQL plugin is added
- Check DATABASE_URL is auto-set
- Run migrations: `railway run npm run prisma:deploy`

### Frontend Issues

**Problem**: API calls fail
- Verify VITE_API_URL points to Railway backend
- Check Railway backend is running
- Inspect browser console for CORS errors

**Problem**: WebSocket doesn't connect
- Ensure VITE_WS_URL matches backend URL
- Check Railway backend CORS_ORIGIN includes Vercel URL
- Verify WebSocket isn't blocked by firewall

### Common Fixes

1. **Clear browser cache** and localStorage
2. **Redeploy** both backend and frontend
3. **Check environment variables** are correctly set
4. **View logs** in Railway and Vercel dashboards

---

## Scaling Tips

### Horizontal Scaling
- Railway automatically handles multiple instances
- Redis adapter enables Socket.io across instances
- Use Railway's autoscaling features

### Performance
- Enable Railway's CDN for static assets
- Use Vercel's Edge Network automatically
- Add database indexes for common queries
- Implement message pagination (already built-in)

### Monitoring
- Enable Railway metrics
- Use Vercel Analytics
- Set up Sentry for error tracking
- Configure uptime monitoring (UptimeRobot, Pingdom)

---

## Custom Domain Setup

### Vercel (Frontend)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as shown
4. SSL is automatic

### Railway (Backend - Optional)
1. Go to Service Settings → Domains
2. Add custom domain
3. Update DNS records
4. Update Vercel environment variables with new backend URL

---

## Security Best Practices

✅ **Do's**
- Use strong JWT secrets (64+ random characters)
- Enable HTTPS (automatic on Railway/Vercel)
- Set restrictive CORS origins
- Keep dependencies updated
- Enable rate limiting (built-in)
- Use environment variables for secrets

❌ **Don'ts**
- Don't commit `.env` files
- Don't use weak secrets in production
- Don't expose database credentials
- Don't disable CORS in production
- Don't use default passwords

---

## Backup & Recovery

### Database Backups (Railway)
- Railway automatically backs up PostgreSQL
- Access backups in Railway dashboard
- Can restore to any point in time

### Manual Backup
```bash
# Backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore
railway run psql $DATABASE_URL < backup.sql
```

---

## Getting Help

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Project Issues**: Check GitHub repository issues
- **Community**: Railway and Vercel Discord servers

---

## Next Steps After Deployment

1. **Invite team members** to test the app
2. **Monitor performance** and error rates
3. **Implement additional features**:
   - Direct messages
   - File uploads
   - User search
   - Message search
   - Notifications
4. **Set up CI/CD** for automatic deployments
5. **Add analytics** to track usage
6. **Implement backups** strategy
7. **Scale resources** based on usage

---

## Success! 🎉

Your Slack clone is now live and ready to use!

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.railway.app

Share with your team and start collaborating! 🚀
