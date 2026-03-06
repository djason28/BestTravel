# Multi-stage build for optimized production image
# Stage 1: Builder
FROM golang:1.23 AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./cmd/server

# Stage 2: Production
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .

# Copy database file if exists (optional, can be mounted as volume)
# COPY --from=builder /app/besttravel.db .

# Create necessary directories
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8080

# Set environment variables
ENV GIN_MODE=release
ENV PORT=8080

# Run the application
CMD ["./server"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/health || exit 1
