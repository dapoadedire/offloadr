# Available commands (run 'make help' to see this list)
.PHONY: help run dev build clean deps tidy fmt vet lint security-check swagger \
	docker-build docker-run docker-stop install-tools

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

# (Removed database and services targets that reference docker-compose, migrations, or seed commands
# because those resources are not present in this repository.)

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

