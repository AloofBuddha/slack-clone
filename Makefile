# Slack Clone - Makefile for easy project management

.PHONY: help install dev build clean docker-up docker-down prisma-studio test lint

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Slack Clone - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@npm install
	@cd backend && npm install
	@cd frontend && npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

docker-up: ## Start Docker containers (PostgreSQL + Redis)
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Containers started$(NC)"

docker-down: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Containers stopped$(NC)"

docker-restart: ## Restart Docker containers
	@echo "$(BLUE)Restarting Docker containers...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✓ Containers restarted$(NC)"

docker-logs: ## View Docker container logs
	@docker-compose logs -f

setup: docker-up install ## Complete setup (Docker + Install + Migrations)
	@echo "$(BLUE)Generating Prisma client...$(NC)"
	@cd backend && npm run prisma:generate
	@echo "$(BLUE)Running database migrations...$(NC)"
	@cd backend && npm run prisma:migrate
	@echo "$(GREEN)✓ Setup complete! Run 'make dev' to start$(NC)"

prisma-generate: ## Generate Prisma client
	@cd backend && npm run prisma:generate
	@echo "$(GREEN)✓ Prisma client generated$(NC)"

prisma-migrate: ## Run database migrations
	@cd backend && npm run prisma:migrate
	@echo "$(GREEN)✓ Migrations complete$(NC)"

prisma-studio: ## Open Prisma Studio (database GUI)
	@cd backend && npm run prisma:studio

dev: ## Start development servers (backend + frontend)
	@echo "$(BLUE)Starting development servers...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:5173$(NC)"
	@npm run dev

dev-backend: ## Start only backend server
	@cd backend && npm run dev

dev-frontend: ## Start only frontend server
	@cd frontend && npm run dev

build: ## Build for production
	@echo "$(BLUE)Building backend...$(NC)"
	@cd backend && npm run build
	@echo "$(BLUE)Building frontend...$(NC)"
	@cd frontend && npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	@cd backend && npm test
	@cd frontend && npm test
	@echo "$(GREEN)✓ Tests complete$(NC)"

test-backend: ## Run backend tests
	@cd backend && npm test

test-frontend: ## Run frontend tests
	@cd frontend && npm test

lint: ## Lint all code
	@echo "$(BLUE)Linting code...$(NC)"
	@cd backend && npm run lint
	@cd frontend && npm run lint
	@echo "$(GREEN)✓ Linting complete$(NC)"

lint-fix: ## Lint and fix all code
	@echo "$(BLUE)Linting and fixing code...$(NC)"
	@cd backend && npm run lint --fix || true
	@cd frontend && npm run lint --fix || true
	@echo "$(GREEN)✓ Linting complete$(NC)"

clean: ## Clean all build artifacts and dependencies
	@echo "$(RED)Cleaning project...$(NC)"
	@rm -rf backend/node_modules backend/dist
	@rm -rf frontend/node_modules frontend/dist
	@rm -rf node_modules
	@echo "$(GREEN)✓ Clean complete$(NC)"

reset-db: ## Reset database (WARNING: deletes all data)
	@echo "$(RED)WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? (y/N): " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd backend && npm run prisma:migrate -- reset; \
		echo "$(GREEN)✓ Database reset$(NC)"; \
	fi

logs-backend: ## View backend logs
	@cd backend && npm run dev | tee backend.log

logs-frontend: ## View frontend logs
	@cd frontend && npm run dev | tee frontend.log

status: ## Check status of all services
	@echo "$(BLUE)Service Status:$(NC)"
	@echo ""
	@echo "$(YELLOW)Docker Containers:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(YELLOW)Node Version:$(NC) $$(node --version)"
	@echo "$(YELLOW)NPM Version:$(NC) $$(npm --version)"

quick-start: ## Quick start for first-time setup
	@echo "$(BLUE)╔════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║   Slack Clone - Quick Start Setup     ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Step 1: Starting Docker...$(NC)"
	@$(MAKE) -s docker-up
	@sleep 3
	@echo ""
	@echo "$(YELLOW)Step 2: Installing dependencies...$(NC)"
	@$(MAKE) -s install
	@echo ""
	@echo "$(YELLOW)Step 3: Setting up database...$(NC)"
	@$(MAKE) -s prisma-generate
	@$(MAKE) -s prisma-migrate
	@echo ""
	@echo "$(GREEN)╔════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║         Setup Complete! 🎉             ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Run: $(GREEN)make dev$(NC)"
	@echo "  2. Open: $(YELLOW)http://localhost:5173$(NC)"
	@echo "  3. Register a new account and start messaging!"
	@echo ""
