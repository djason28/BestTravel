# BestTravel Backend Development Script
# Auto-reload Go server on file changes

Write-Host "Starting BestTravel Backend with Auto-Reload..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Check if CompileDaemon is installed
if (-not (Get-Command CompileDaemon -ErrorAction SilentlyContinue)) {
    Write-Host "CompileDaemon not found in PATH!" -ForegroundColor Red
    Write-Host "Installing CompileDaemon..." -ForegroundColor Yellow
    go install github.com/githubnemo/CompileDaemon@latest
    
    # Add Go bin to PATH for this session
    $env:PATH += ";$env:USERPROFILE\go\bin"
    
    Write-Host "CompileDaemon installed!" -ForegroundColor Green
    Write-Host ""
}

# Run CompileDaemon
# Note: graceful-kill is not supported on Windows
CompileDaemon `
    --build="go build -o ..\bin\server.exe .\cmd\server" `
    --command="..\bin\server.exe" `
    --pattern="\.go$" `
    --exclude-dir="bin,vendor,uploads" `
    --color=true `
    --log-prefix=false
