# Slack Clone - Full-Stack Real-Time Messaging Application

A production-ready Slack clone built with React, NestJS, PostgreSQL, and Socket.io. Supports real-time messaging, channels, direct messages, file uploads, and more.

## Features

### Phase 1 - Core (MVP)
- ✅ User authentication (JWT-based)
- ✅ Workspace creation and management
- ✅ Public channels
- ✅ Real-time messaging with Socket.io
- ✅ Modern UI with shadcn/ui + Tailwind CSS
- ✅ Message threads
- ✅ File uploads
- ✅ User presence tracking
- ✅ Message reactions

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **shadcn/ui** + Tailwind CSS for UI
- **Zustand** for state management
- **Socket.io-client** for real-time communication
- **React Hook Form** + Zod for forms
- **React Router** for navigation

### Backend
- **NestJS** with TypeScript
- **PostgreSQL** for database
- **Redis** for caching and Socket.io adapter
- **Socket.io** for WebSocket communication
- **Passport JWT** for authentication
- **Prisma** as ORM
- **Multer** for file uploads

### Infrastructure
- **Docker** + Docker Compose for local development
- **Vercel** for frontend hosting
- **Railway** for backend + database
- **Upstash** for Redis
- **Vercel Blob** for file storage

## Project Structure

```
slack-clone/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── features/     # Feature modules
│   │   ├── hooks/        # Custom React hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── services/     # API clients
│   │   ├── types/        # TypeScript types
│   │   └── lib/          # Utilities
│   └── package.json
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── workspaces/   # Workspace module
│   │   ├── channels/     # Channel management
│   │   ├── messages/     # Messaging
│   │   ├── files/        # File uploads
│   │   └── gateway/      # WebSocket gateway
│   └── package.json
├── docker-compose.yml    # Local development
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose
- Git

### Local Development Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd slack-clone
```

2. **Start infrastructure services (PostgreSQL + Redis)**
```bash
docker-compose up -d
```

3. **Set up backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

4. **Set up frontend**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/slack_clone
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

## Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (Railway)
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add PostgreSQL: `railway add --plugin postgresql`
5. Add Redis: `railway add --plugin redis`
6. Deploy: `railway up`

### Environment Setup for Production
- Add all environment variables in Railway dashboard
- Update CORS_ORIGIN to your Vercel URL
- Update frontend VITE_API_URL to Railway URL

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `POST /api/workspaces/:id/invite` - Invite user

### Channels
- `GET /api/workspaces/:id/channels` - List channels
- `POST /api/channels` - Create channel
- `GET /api/channels/:id` - Get channel details
- `POST /api/channels/:id/join` - Join channel
- `GET /api/channels/:id/messages` - Get messages

### Messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/:id/reactions` - Add reaction

### WebSocket Events
- `message:new` - New message received
- `message:updated` - Message edited
- `message:deleted` - Message deleted
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `user:presence` - User presence changed

## Database Schema

Key tables:
- **users** - User accounts
- **workspaces** - Workspace/team containers
- **workspace_members** - User-workspace relationships
- **channels** - Communication channels
- **channel_members** - User-channel relationships
- **messages** - Chat messages
- **reactions** - Message reactions
- **files** - Uploaded files

## Development Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## Performance & Scaling

The application is designed to handle 1000+ concurrent users:
- Horizontal scaling with Redis adapter for Socket.io
- Database connection pooling
- Efficient database indexes
- Message pagination
- Rate limiting
- Caching strategies

## Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention (Prisma)
- XSS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open a GitHub issue.
