#!/bin/bash

# ALL-DLP Setup Script
# This script sets up the development environment for ALL-DLP

set -e

echo "🎵 ALL-DLP Setup Script"
echo "========================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the electron-app directory."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
if [ -f "api/requirements.txt" ]; then
    pip install -r api/requirements.txt
    echo "✅ Python dependencies installed"
else
    echo "❌ Error: api/requirements.txt not found"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install
echo "✅ Node.js dependencies installed"

# Download FFmpeg
echo "🎬 Downloading FFmpeg..."
npm run download-ffmpeg
echo "✅ FFmpeg downloaded"

# Create downloads directory
echo "📁 Creating downloads directory..."
mkdir -p ~/Downloads/all-dlp
echo "✅ Downloads directory created: ~/Downloads/all-dlp"

echo ""
echo "🎉 Setup complete!"
echo "=================="
echo "To start development:"
echo "  npm run dev"
echo ""
echo "To build the application:"
echo "  npm run build"
echo ""
echo "To create a release:"
echo "  ./scripts/create-release.sh" 