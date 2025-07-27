#!/bin/bash

echo "🎵 Setting up bB Downloader..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    echo "Visit https://www.python.org/downloads/ to download Python."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

echo "✅ pip3 found: $(pip3 --version)"

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv

if [ $? -eq 0 ]; then
    echo "✅ Virtual environment created successfully!"
else
    echo "❌ Failed to create virtual environment."
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r api/requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully!"
else
    echo "❌ Failed to install Python dependencies."
    exit 1
fi

# Check if yt-dlp is available
if ! command -v yt-dlp &> /dev/null; then
    echo "⚠️  yt-dlp not found in PATH. Installing via pip..."
    pip install yt-dlp
fi

# Check if spotdl is available
if ! command -v spotdl &> /dev/null; then
    echo "⚠️  spotdl not found in PATH. Installing via pip..."
    pip install spotdl
fi

# Check if scdl is available
if ! command -v scdl &> /dev/null; then
    echo "⚠️  scdl not found in PATH. Installing via pip..."
    pip install scdl
fi

# Check if ffmpeg is available (required for audio conversion)
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg not found. This is required for audio conversion."
    echo "Please install ffmpeg:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
fi

# Create downloads directory
echo "📁 Creating downloads directory..."
mkdir -p ~/Downloads/bB-downloader

echo "🎉 Setup complete! You can now run the application with:"
echo "   npm start"
echo ""
echo "The app will automatically start the Python API server using the virtual environment." 