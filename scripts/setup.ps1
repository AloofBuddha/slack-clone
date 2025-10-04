# Slack Clone - Automated Setup Script for Windows
# This script sets up the entire development environment

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Slack Clone - Automated Setup       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 20+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✓ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✓ Docker installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Please install Docker Desktop from https://www.docker.com" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Prerequisites check complete!" -ForegroundColor Green
Write-Host ""

# Step 1: Start Docker containers
Write-Host "Step 1/5: Starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start Docker containers" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker containers started" -ForegroundColor Green

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
for ($i = 1; $i -le $maxAttempts; $i++) {
    $result = docker-compose exec -T postgres pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green
        break
    }
    if ($i -eq $maxAttempts) {
        Write-Host "PostgreSQL failed to become ready in time" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Still waiting... ($i/$maxAttempts)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

# Step 2: Install backend dependencies
Write-Host ""
Write-Host "Step 2/5: Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Step 3: Setup backend environment and database
Write-Host ""
Write-Host "Step 3/5: Setting up backend..." -ForegroundColor Cyan

# Copy .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to generate Prisma client" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to run migrations" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✓ Backend setup complete" -ForegroundColor Green
Set-Location ..

# Step 4: Install frontend dependencies
Write-Host ""
Write-Host "Step 4/5: Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Copy .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..

# Step 5: Verify setup
Write-Host ""
Write-Host "Step 5/5: Verifying setup..." -ForegroundColor Cyan

# Check Docker containers
$containers = docker-compose ps -q
if ($containers) {
    Write-Host "✓ Docker containers running" -ForegroundColor Green
} else {
    Write-Host "⚠ Docker containers may not be running properly" -ForegroundColor Yellow
}

# Check if node_modules exist
if ((Test-Path "backend/node_modules") -and (Test-Path "frontend/node_modules")) {
    Write-Host "✓ All dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠ Some dependencies may be missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║      Setup Complete! 🎉                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "     (Open a new terminal window for this)" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Open browser: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  - View database: cd backend && npm run prisma:studio" -ForegroundColor White
Write-Host "  - Stop Docker: docker-compose down" -ForegroundColor White
Write-Host "  - View logs: docker-compose logs -f" -ForegroundColor White
Write-Host ""
Write-Host "For deployment instructions, see DEPLOYMENT.md" -ForegroundColor Gray
Write-Host ""
