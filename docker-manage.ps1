# Quick Docker Management Script

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "logs", "status", "clean")]
    [string]$Action = "status"
)

function Show-Usage {
    Write-Host ""
    Write-Host "🐳 BestTravel Docker Manager" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\docker-manage.ps1 [action]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  start    - Start containers" -ForegroundColor White
    Write-Host "  stop     - Stop containers" -ForegroundColor White
    Write-Host "  restart  - Restart containers" -ForegroundColor White
    Write-Host "  logs     - View logs" -ForegroundColor White
    Write-Host "  status   - Show container status" -ForegroundColor White
    Write-Host "  clean    - Stop and remove all data (⚠️  careful!)" -ForegroundColor White
    Write-Host ""
}

switch ($Action) {
    "start" {
        Write-Host "🚀 Starting containers..." -ForegroundColor Green
        docker-compose up -d
        Write-Host ""
        Write-Host "Access: http://localhost" -ForegroundColor Cyan
    }
    "stop" {
        Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
        docker-compose down
    }
    "restart" {
        Write-Host "🔄 Restarting containers..." -ForegroundColor Yellow
        docker-compose restart
        Write-Host ""
        Write-Host "Access: http://localhost" -ForegroundColor Cyan
    }
    "logs" {
        Write-Host "📋 Showing logs (Ctrl+C to exit)..." -ForegroundColor Cyan
        Write-Host ""
        docker-compose logs -f
    }
    "status" {
        Write-Host "📊 Container Status:" -ForegroundColor Cyan
        Write-Host ""
        docker-compose ps
        Write-Host ""
        Write-Host "Use: .\docker-manage.ps1 [action]" -ForegroundColor Gray
        Show-Usage
    }
    "clean" {
        Write-Host "⚠️  WARNING: This will remove all containers and data!" -ForegroundColor Red
        $confirm = Read-Host "Type 'yes' to confirm"
        if ($confirm -eq "yes") {
            Write-Host "🗑️  Cleaning up..." -ForegroundColor Yellow
            docker-compose down -v
            Remove-Item -Recurse -Force data -ErrorAction SilentlyContinue
            Remove-Item -Recurse -Force uploads -ErrorAction SilentlyContinue
            Write-Host "✅ Cleaned!" -ForegroundColor Green
        } else {
            Write-Host "Cancelled." -ForegroundColor Gray
        }
    }
}
