#!/bin/bash

# ALL-DLP API Server Startup Script
# This script starts the API server from the electron-app directory

set -e

echo "🎵 ALL-DLP API Server Startup"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the electron-app directory."
    exit 1
fi

# Check if api directory exists
if [ ! -d "api" ]; then
    echo "❌ Error: api directory not found."
    exit 1
fi

# Detect current architecture
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    VENV_DIR="venv-x64"
    echo "🖥️  Detected Intel x86_64 architecture"
elif [ "$ARCH" = "arm64" ]; then
    VENV_DIR="venv-arm64"
    echo "🍎 Detected Apple Silicon ARM64 architecture"
else
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "❌ Error: Virtual environment not found. Please run setup.sh first."
    echo "  ./setup.sh"
    exit 1
fi

echo "✅ Found API directory and virtual environment ($VENV_DIR)"

# Change to api directory and start server
echo "🚀 Starting API server..."
cd api

# Activate virtual environment
source "../$VENV_DIR/bin/activate"

# Start the API server
echo "📡 API server will be available at: http://127.0.0.1:8000"
echo "📋 Log file: ~/Downloads/all-dlp/all-dlp.log"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

python api_server.py 