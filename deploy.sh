#!/usr/bin/env bash
set -euo pipefail

# Deploy BestTravel on Linux with Docker Compose
# - Builds frontend via Node container
# - Starts/rebuilds services

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker CE and docker compose plugin first." >&2
  exit 1
fi

# Ensure we are at repo root
dirname=$(basename "$PWD")
if [ "$dirname" != "BestTravel" ] && [ ! -f "docker-compose.yml" ]; then
  echo "Run this script from the repository root (where docker-compose.yml exists)." >&2
  exit 1
fi

# Sanity: .env should exist
if [ ! -f ".env" ]; then
  echo ".env not found. Copy .env.example to .env and set DOMAIN and JWT_SECRET." >&2
  exit 1
fi

# Build frontend without installing Node on the host
echo "[1/3] Building frontend (views/dist) using node:20-alpine..."
docker run --rm \
  -v "$(pwd)/views":/app \
  -w /app node:20-alpine sh -c "npm ci && npm run build"

echo "[2/3] Creating data and uploads directories if missing..."
mkdir -p data uploads

# Start or rebuild stack
echo "[3/3] Starting stack with docker compose..."
docker compose up -d --build

echo "\nDone. Check logs with: docker compose logs -f\n"