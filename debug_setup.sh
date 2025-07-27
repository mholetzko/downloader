#!/bin/bash

# Check if we're in the right directory
if [ ! -f "api/api_server.py" ]; then
    echo "Error: api/api_server.py not found. Please run this script from the electron-app directory."
    exit 1
fi

echo "🔧 Setting up debug environment for bB Downloader..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or later."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r api/requirements.txt

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Download FFmpeg if not present
if [ ! -f "ffmpeg/ffmpeg" ]; then
    echo "📥 Downloading FFmpeg..."
    npm run download-ffmpeg
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application in development mode:"
echo "   npm run dev"
echo ""
echo "🔧 To start just the API server:"
echo "   python api/api_server.py"
echo ""
echo "🌐 To start just the Electron app:"
echo "   npm start" 