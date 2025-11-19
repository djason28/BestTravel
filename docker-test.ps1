# Docker Testing Script for BestTravel
$ErrorActionPreference = "Stop"

Write-Host "Docker BestTravel Setup & Testing" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[1/7] Checking Docker..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker not found!" -ForegroundColor Red
    exit 1
}
try {
    docker ps | Out-Null
    Write-Host "OK: Docker is running" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    exit 1
}

# Build frontend
Write-Host ""
Write-Host "[2/7] Checking frontend..." -ForegroundColor Yellow
if (-not (Test-Path "views/node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Gray
    Push-Location views
    npm install
    Pop-Location
}

Write-Host "[3/7] Building frontend..." -ForegroundColor Yellow
Push-Location views
npm run build
Pop-Location

if (-not (Test-Path "views/dist")) {
    Write-Host "ERROR: Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Frontend built" -ForegroundColor Green

# Setup environment
Write-Host ""
Write-Host "[4/7] Setting up environment..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item .env.example -Destination .env
    Write-Host "OK: Created .env file" -ForegroundColor Green
} else {
    Write-Host "OK: .env file exists" -ForegroundColor Green
}

# Create directories
Write-Host ""
Write-Host "[5/7] Creating directories..." -ForegroundColor Yellow
@("data", "uploads") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ | Out-Null
    }
}
Write-Host "OK: Directories ready" -ForegroundColor Green

# Clean up
Write-Host ""
Write-Host "[6/7] Cleaning up old containers..." -ForegroundColor Yellow
docker-compose down 2>$null | Out-Null
Write-Host "OK: Cleaned up" -ForegroundColor Green

# Start containers
Write-Host ""
Write-Host "[7/7] Starting Docker containers..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray
Write-Host ""

docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! BestTravel is now running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your application:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost" -ForegroundColor White
    Write-Host "  API:      http://localhost/api" -ForegroundColor White
    Write-Host "  Health:   http://localhost/health" -ForegroundColor White
    Write-Host ""
    Write-Host "View logs: docker-compose logs -f" -ForegroundColor Gray
    Write-Host "Stop:      docker-compose down" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Showing logs (Ctrl+C to exit)..." -ForegroundColor Yellow
    Write-Host ""
    
    Start-Sleep -Seconds 2
    docker-compose logs -f
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to start containers!" -ForegroundColor Red
    Write-Host ""
    docker-compose logs
    exit 1
}
