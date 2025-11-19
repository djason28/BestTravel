#!/bin/bash
# BestTravel Backend Development Script (Unix/Linux/Mac)
# Auto-reload Go server on file changes

echo "Starting BestTravel Backend with Auto-Reload..."
echo "Press Ctrl+C to stop"
echo ""

# Check if CompileDaemon is installed
if ! command -v CompileDaemon &> /dev/null; then
    echo "CompileDaemon not found!"
    echo "Installing CompileDaemon..."
    go install github.com/githubnemo/CompileDaemon@latest
    echo "CompileDaemon installed!"
    echo ""
fi

# Run CompileDaemon
CompileDaemon \
    --build="go build -o ../bin/server ./cmd/server" \
    --command="../bin/server" \
    --pattern="\.go$" \
    --exclude-dir="bin,vendor,uploads" \
    --color=true \
    --log-prefix=false \
    --graceful-kill=true
