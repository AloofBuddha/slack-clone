# ⚡ Quick Start Guide

Get your Slack clone running in 5 minutes!

## 📋 Prerequisites Checklist

- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm 10+ installed (`npm --version`)
- [ ] Docker Desktop installed and running
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 🚀 Step-by-Step Setup

### Step 1: Start Infrastructure (1 minute)

```bash
cd slack-clone
docker-compose up -d
```

✅ This starts PostgreSQL and Redis in the background.

**Verify it's running:**
```bash
docker-compose ps
```

### Step 2: Setup Backend (2 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start backend server
npm run dev
```

✅ Backend will be running at `http://localhost:3000`

**Test backend:**
```bash
curl http://localhost:3000/api/auth/me
# Should return 401 (Unauthorized) - this is correct!
```

### Step 3: Setup Frontend (2 minutes)

Open a **new terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start frontend server
npm run dev
```

✅ Frontend will be running at `http://localhost:5173`

### Step 4: Open and Test (30 seconds)

1. Open browser: `http://localhost:5173`
2. Click "**Create new account**"
3. Register with:
   - Display Name: Your Name
   - Email: test@example.com
   - Password: password123
4. Click "**Create account**"
5. You're in! 🎉

## ✨ First Steps in the App

### Create Your First Workspace

1. Click the "**+**" button next to workspace name
2. Enter workspace name: "My Team"
3. Click "**Create Workspace**"

### Create Your First Channel

1. Click "**+**" next to "Channels"
2. Enter channel name: "random"
3. Add description: "Random discussions"
4. Click "**Create Channel**"

### Send Your First Message

1. Select the "general" or "random" channel
2. Type a message in the input box
3. Press Enter or click Send
4. See your message appear instantly!

### Test Real-Time Features

**Open two browser windows side-by-side:**

Window 1: `http://localhost:5173`
Window 2: `http://localhost:5173` (incognito mode)

**In Window 2:**
- Register a new account (different email)
- Join the same workspace (you'll need to be invited or create a new one)
- Both users send messages
- See messages appear in real-time! ⚡

## 🎯 What to Try Next

- [ ] Edit a message (hover over your message, click edit icon)
- [ ] Delete a message (hover over your message, click delete icon)
- [ ] Add reactions (hover over message, click smile icon)
- [ ] Create more channels
- [ ] Watch typing indicators
- [ ] Check user online/offline status

## 🐛 Troubleshooting

### Backend won't start

**Error: "Can't reach database server"**
```bash
# Check if Docker is running
docker-compose ps

# If not running, start it
docker-compose up -d

# If already running, restart
docker-compose restart
```

### Frontend can't connect to backend

**Error: "Network Error" or "Failed to fetch"**

1. Check backend is running: `http://localhost:3000/api/auth/me`
2. Check `.env` in frontend has correct URL:
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=http://localhost:3000
   ```
3. Restart frontend: `npm run dev`

### Port already in use

**Error: "EADDRINUSE: address already in use"**

**On Windows:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**On Mac/Linux:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database migrations failed

```bash
cd backend

# Reset database (WARNING: deletes all data)
npm run prisma:migrate -- reset

# Or manually
rm -rf prisma/migrations
npm run prisma:migrate
```

### Nothing works!

**Nuclear option - start fresh:**

```bash
# Stop all containers
docker-compose down -v

# Remove node_modules
rm -rf backend/node_modules frontend/node_modules

# Start from Step 1
docker-compose up -d
```

## 📱 Access Points

After setup, you can access:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Main application |
| Backend API | http://localhost:3000 | REST API |
| Prisma Studio | http://localhost:5555 | Database viewer |
| PostgreSQL | localhost:5432 | Database (use GUI client) |
| Redis | localhost:6379 | Cache (use redis-cli) |

## 🔧 Useful Commands

### Backend

```bash
cd backend

npm run dev              # Start development server
npm run build            # Build for production
npm run start:prod       # Start production server
npm run prisma:studio    # Open database GUI
npm run prisma:generate  # Regenerate Prisma client
npm run lint             # Lint code
```

### Frontend

```bash
cd frontend

npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Lint code
```

### Docker

```bash
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose ps        # Check status
docker-compose logs      # View logs
docker-compose restart   # Restart services
```

## 🎓 Learning Path

Now that you have it running:

1. **Explore the Code**
   - Start with `backend/src/main.ts`
   - Check `frontend/src/App.tsx`
   - Read `backend/prisma/schema.prisma`

2. **Read Documentation**
   - `README.md` - Project overview
   - `FEATURES.md` - All features explained
   - `SETUP_GUIDE.md` - Detailed setup guide

3. **Understand Architecture**
   - How authentication works
   - How WebSocket connects
   - How messages are stored

4. **Make Changes**
   - Try changing UI colors
   - Add a new field to messages
   - Create a new API endpoint

## 🚀 Next Steps

### Ready to Deploy?

Read `DEPLOYMENT.md` for production deployment:
- Deploy to Railway (backend)
- Deploy to Vercel (frontend)
- Live in 10 minutes!

### Want to Contribute?

Read `CONTRIBUTING.md` for guidelines:
- Code style
- How to submit PRs
- What to work on

### Need Help?

- Check `SETUP_GUIDE.md` for detailed instructions
- Read `FEATURES.md` for feature documentation
- Review code comments
- Open a GitHub issue

## ✅ Success Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Database accessible (Prisma Studio works)
- [ ] Can register new account
- [ ] Can create workspace
- [ ] Can create channel
- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Can edit/delete own messages
- [ ] Can add reactions
- [ ] Typing indicators work
- [ ] User status shows online/offline

## 🎉 Congratulations!

You now have a fully functional Slack clone running locally!

**Time to deploy?** → Read `DEPLOYMENT.md`  
**Want to customize?** → Read `PROJECT_SUMMARY.md`  
**Ready to contribute?** → Read `CONTRIBUTING.md`

---

**Happy coding!** 🚀
