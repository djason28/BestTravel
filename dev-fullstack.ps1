# BestTravel Development - Full Stack
# Runs both Frontend (Vite) and Backend (Go with auto-reload) concurrently

Write-Host "🚀 Starting BestTravel Full Stack Development..." -ForegroundColor Cyan
Write-Host ""

# Start Backend in background
Write-Host "📦 Starting Backend (Go with auto-reload)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\core'; .\dev.ps1"

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start Frontend in background
Write-Host "⚛️  Starting Frontend (Vite)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\views'; npm run dev"

Write-Host ""
Write-Host "✅ Both servers starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8080" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Close the terminal windows to stop servers" -ForegroundColor Gray
