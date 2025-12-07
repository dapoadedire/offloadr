# Build stage
FROM golang:1.24-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Install swag for generating Swagger documentation
RUN go install github.com/swaggo/swag/cmd/swag@latest

# Copy the entire source code
COPY . .

# Generate Swagger documentation
RUN swag init -g cmd/api/main.go -o docs

# Build the application
# CGO_ENABLED=0 for static binary, GOOS=linux for linux target
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo \
    -ldflags='-w -s -extldflags "-static"' \
    -o /app/bin/api ./cmd/api/*.go

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

# Create a non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

# Copy CA certificates from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy the binary from builder
COPY --from=builder /app/bin/api /app/api

# Copy migrations directory (needed for runtime migrations)
COPY --from=builder /app/migrations /app/migrations

# Optional: Copy .env.example if you have one (not .env for security)
# Users should mount their own .env or use environment variables
# COPY --from=builder /app/.env.example /app/.env.example

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the application port (Cloud Run will inject PORT env variable)
EXPOSE 8080

# Run the application
CMD ["/app/api"]