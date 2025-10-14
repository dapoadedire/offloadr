# Available commands (run 'make help' to see this list)
.PHONY: help run dev build clean deps tidy fmt vet lint security-check swagger \
        db-start db-stop db-clean db-restart db-logs db-shell db-migrate-up db-migrate-down db-migrate-create db-migrate-status db-migrate-reset db-seed \
        docker-build docker-run docker-stop install-tools \
        services-start services-stop services-restart services-logs services-ps

# Default target - show help
help:
	@echo "Available commands:"
	@echo "  Development:"
	@echo "    run              - Run the application directly with go run"
	@echo "    dev              - Start development server with hot reloading using Air"
	@echo "    build            - Build the application binary"
	@echo "    install-tools    - Install development tools (air, goose, etc.)"
	@echo ""
	@echo "  Code Quality:"
	@echo "    fmt              - Format Go code using gofmt"
	@echo "    vet              - Run go vet to check for suspicious code"
	@echo "    lint             - Run golangci-lint for code analysis"
	@echo "    security-check   - Run gosec to check for security issues"
	@echo ""
	@echo "  Documentation:"
	@echo "    swagger          - Generate Swagger/OpenAPI documentation"
	@echo ""
	@echo "  Services & Infrastructure:"
	@echo "    services-start   - Start all services (db)"
	@echo "    services-stop    - Stop all services"
	@echo "    services-restart - Restart all services"
	@echo "    services-logs    - View logs from all services"
	@echo "    services-ps      - Show status of all services"
	@echo ""
	@echo "  Database:"
	@echo "    db-start         - Start PostgreSQL database using Docker"
	@echo "    db-stop          - Stop PostgreSQL database"
	@echo "    db-clean         - Stop and remove database containers and volumes"
	@echo "    db-restart       - Restart PostgreSQL database"
	@echo "    db-logs          - View database container logs"
	@echo "    db-shell         - Connect to database shell (psql)"
	@echo "    db-migrate-up    - Run pending database migrations"
	@echo "    db-migrate-down  - Rollback last database migration"
	@echo "    db-migrate-create - Create new migration file"
	@echo "    db-migrate-status - Check migration status"
	@echo "    db-migrate-reset - Reset database and reapply all migrations (CAUTION: Destroys all data)"
	@echo ""
	@echo "  Docker:"
	@echo "    docker-build     - Build Docker image"
	@echo "    docker-run       - Run application in Docker container"
	@echo "    docker-stop      - Stop Docker container"
	@echo ""
	@echo "  Maintenance:"
	@echo "    deps             - Download and install dependencies"
	@echo "    tidy             - Clean up go.mod and go.sum files"
	@echo "    clean            - Remove build artifacts and temp files"

# =============================================================================
# DEVELOPMENT COMMANDS
# =============================================================================

# Run the application directly with go run
run:
	go run cmd/api/*.go

# Start development server with hot reloading using Air
dev:
	air

# Build the application binary for production
build:
	@echo "Building application..."
	go build -o bin/api cmd/api/*.go
	@echo "Binary built: bin/api"

# Install development tools required for this project
install-tools:
	@echo "Installing development tools..."
	go install github.com/cosmtrek/air@latest
	go install github.com/pressly/goose/v3/cmd/goose@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
	@echo "Tools installed successfully!"

# =============================================================================
# CODE QUALITY COMMANDS
# =============================================================================

# Format Go code using gofmt (fixes formatting issues)
fmt:
	@echo "Formatting Go code..."
	gofmt -s -w .
	@echo "Code formatted successfully!"

# Run go vet to check for suspicious code constructs
vet:
	@echo "Running go vet..."
	go vet ./...
	@echo "Vet check completed!"

# Run golangci-lint for comprehensive code analysis
lint:
	@echo "Running linter..."
	golangci-lint run
	@echo "Lint check completed!"

# Run gosec to check for security vulnerabilities
security-check:
	@echo "Running security check..."
	gosec ./...
	@echo "Security check completed!"

# =============================================================================
# DOCUMENTATION COMMANDS
# =============================================================================

# Generate Swagger/OpenAPI documentation from code annotations
swagger:
	@echo "Generating Swagger documentation..."
	$(HOME)/go/bin/swag init -g cmd/api/main.go -o docs
	@echo "Swagger docs generated in ./docs directory!"
	@echo "View at: http://localhost:8080/v1/docs/index.html (when server is running)"

# =============================================================================
# SERVICES & INFRASTRUCTURE COMMANDS
# =============================================================================

# Start all services (database)
services-start:
	@echo "Starting all services..."
	docker compose up -d
	@echo "All services started!"
	@echo ""
	@echo "Services running:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo ""
	@echo "Use 'make services-ps' to check status"

# Stop all services
services-stop:
	@echo "Stopping all services..."
	docker compose stop
	@echo "All services stopped!"

# Restart all services
services-restart:
	@echo "Restarting all services..."
	docker compose restart
	@echo "All services restarted!"

# View logs from all services
services-logs:
	@echo "Showing logs from all services (Ctrl+C to exit)..."
	docker compose logs -f

# Show status of all services
services-ps:
	@echo "Service Status:"
	@docker compose ps

# =============================================================================
# DATABASE COMMANDS
# =============================================================================

# Start PostgreSQL database using Docker Compose in detached mode
db-start:
	@echo "Starting PostgreSQL database..."
	docker compose up -d db
	@echo "Database started! Use 'make db-logs' to view logs"

# Stop PostgreSQL database container
db-stop:
	@echo "Stopping PostgreSQL database..."
	docker compose stop db
	@echo "Database stopped!"

# Stop and remove database containers and volumes (useful for troubleshooting)
db-clean:
	@echo "Stopping and removing database containers and volumes..."
	docker compose down -v
	@echo "Database cleaned! All containers and volumes removed."

# Restart database (stop then start)
db-restart: db-stop db-start
	@echo "Database restarted!"

# View database container logs in real-time
db-logs:
	@echo "Showing database logs (Ctrl+C to exit)..."
	docker compose logs -f db

# Connect to PostgreSQL database shell
db-shell:
	@echo "Connecting to database shell..."
	docker compose exec db psql -U offloadr -d offloadr

# DB connection string using environment variables with defaults
DB_HOST ?= $(or $(POSTGRES_HOST),localhost)
DB_PORT ?= $(or $(POSTGRES_PORT),5432)
DB_USER ?= $(or $(POSTGRES_USER),offloadr)
DB_PASSWORD ?= $(or $(POSTGRES_PASSWORD),offloadr-db-password)
DB_NAME ?= $(or $(POSTGRES_DB),offloadr)
DB_CONN_STRING = "host=$(DB_HOST) user=$(DB_USER) password=$(DB_PASSWORD) dbname=$(DB_NAME) port=$(DB_PORT) sslmode=disable"

# Run all pending database migrations
db-migrate-up:
	@echo "Running database migrations..."
	goose -dir migrations postgres $(DB_CONN_STRING) up
	@echo "Migrations completed!"

# Rollback the last database migration
db-migrate-down:
	@echo "Rolling back last migration..."
	goose -dir migrations postgres $(DB_CONN_STRING) down
	@echo "Migration rolled back!"

# Create a new database migration file
db-migrate-create:
	@read -p "Enter migration name: " name; \
	goose -dir migrations create $$name sql && \
	echo "Migration created: migrations/$$(date +%Y%m%d%H%M%S)_$$name.sql"

# Check the status of database migrations
db-migrate-status:
	@echo "Checking migration status..."
	goose -dir migrations postgres $(DB_CONN_STRING) status

# Reset the database and reapply all migrations (CAUTION: Destroys all data)
db-migrate-reset:
	@echo "WARNING: This will delete all data in your database."
	@read -p "Are you sure you want to continue? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "Resetting database..."; \
		goose -dir migrations postgres $(DB_CONN_STRING) reset; \
		echo "Database reset complete. Running migrations..."; \
		goose -dir migrations postgres $(DB_CONN_STRING) up; \
		echo "All migrations applied successfully!"; \
	else \
		echo "Operation cancelled."; \
	fi

# Seed the database with fake data
db-seed:
	@echo "Seeding database with fake data..."
	go run cmd/seed/main.go
	@echo "Database seeded successfully!"

# =============================================================================
# DOCKER COMMANDS
# =============================================================================

# Build Docker image for the application
docker-build:
	@echo "Building Docker image..."
	docker build -t backend-engineering-go .
	@echo "Docker image built: backend-engineering-go"

# Run application in Docker container
docker-run:
	@echo "Running application in Docker..."
	docker run -p 8080:8080 --name backend-api backend-engineering-go

# Stop and remove Docker container
docker-stop:
	@echo "Stopping Docker container..."
	docker stop backend-api || true
	docker rm backend-api || true
	@echo "Container stopped and removed!"

# =============================================================================
# MAINTENANCE COMMANDS
# =============================================================================

# Download and install Go dependencies
deps:
	@echo "Downloading dependencies..."
	go mod download
	@echo "Dependencies downloaded!"

# Clean up go.mod and go.sum files (removes unused dependencies)
tidy:
	@echo "Tidying up go.mod..."
	go mod tidy
	@echo "go.mod tidied!"

# Remove build artifacts and temporary files
clean:
	@echo "Cleaning up build artifacts..."
	rm -f bin/api
	rm -rf tmp/
	@echo "Cleanup completed!"

