#!/bin/bash
# Slack Clone - Automated Setup Script for Mac/Linux

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Slack Clone - Automated Setup       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 20+ from https://nodejs.org${NC}"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm: v$NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${RED}✗ Docker not found. Please install Docker from https://www.docker.com${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Prerequisites check complete!${NC}"
echo ""

# Step 1: Start Docker containers
echo -e "${CYAN}Step 1/5: Starting Docker containers...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start Docker containers${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker containers started${NC}"

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}PostgreSQL failed to become ready in time${NC}"
        exit 1
    fi
    echo -e "${YELLOW}  Still waiting... ($i/30)${NC}"
    sleep 2
done

# Step 2: Install backend dependencies
echo ""
echo -e "${CYAN}Step 2/5: Installing backend dependencies...${NC}"
cd backend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install backend dependencies${NC}"
    cd ..
    exit 1
fi
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Step 3: Setup backend environment and database
echo ""
echo -e "${CYAN}Step 3/5: Setting up backend...${NC}"

# Copy .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
fi

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npm run prisma:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate Prisma client${NC}"
    cd ..
    exit 1
fi

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run prisma:migrate
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to run migrations${NC}"
    cd ..
    exit 1
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"
cd ..

# Step 4: Install frontend dependencies
echo ""
echo -e "${CYAN}Step 4/5: Installing frontend dependencies...${NC}"
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies${NC}"
    cd ..
    exit 1
fi

# Copy .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
fi

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# Step 5: Verify setup
echo ""
echo -e "${CYAN}Step 5/5: Verifying setup...${NC}"

# Check Docker containers
if docker-compose ps -q &> /dev/null; then
    echo -e "${GREEN}✓ Docker containers running${NC}"
else
    echo -e "${YELLOW}⚠ Docker containers may not be running properly${NC}"
fi

# Check if node_modules exist
if [ -d "backend/node_modules" ] && [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ All dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Some dependencies may be missing${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      Setup Complete! 🎉                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "  1. Start backend:  ${NC}cd backend && npm run dev"
echo -e "  2. Start frontend: ${NC}cd frontend && npm run dev"
echo -e "     ${YELLOW}(Open a new terminal window for this)${NC}"
echo ""
echo -e "  3. Open browser: ${YELLOW}http://localhost:5173${NC}"
echo ""
echo -e "${CYAN}Useful commands:${NC}"
echo -e "  - View database: ${NC}cd backend && npm run prisma:studio"
echo -e "  - Stop Docker: ${NC}docker-compose down"
echo -e "  - View logs: ${NC}docker-compose logs -f"
echo ""
echo -e "${YELLOW}For deployment instructions, see DEPLOYMENT.md${NC}"
echo ""
