#!/bin/bash

echo "🎵 Building bB Downloader..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the electron-app directory."
    exit 1
fi

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Running setup..."
    ./setup.sh
fi

# Activate Python virtual environment
if [ -f "venv/bin/activate" ]; then
    echo "🐍 Activating Python virtual environment..."
    source venv/bin/activate
else
    echo "❌ venv/bin/activate not found!"
    exit 1
fi

# Download FFmpeg if not already present
if [ ! -d "ffmpeg" ] || [ -z "$(ls -A ffmpeg 2>/dev/null)" ]; then
    echo "📥 Downloading FFmpeg..."
    npm run download-ffmpeg
fi

# Build the Python API server (PyInstaller bundle)
echo "🐍 Building Python API server..."
npm run bundle-python
if [ $? -ne 0 ]; then
    echo "❌ Python API server build failed!"
    exit 1
fi

# Install/update npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run dist

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "📁 Your installable applications are in:"
    echo "   dist/"
    echo ""
    echo "Available formats:"
    echo "  - macOS ARM64: bB Downloader-1.0.0-arm64.dmg"
    echo "  - macOS Intel: bB Downloader-1.0.0.dmg"
    echo ""
    echo "🎉 You can now distribute these .dmg files to users!"
    echo ""
    echo "📋 Installation instructions for users:"
    echo "  1. Download the appropriate .dmg file for their Mac"
    echo "  2. Double-click the .dmg file"
    echo "  3. Drag 'bB Downloader' to Applications folder"
    echo "  4. Launch the app from Applications"
    echo "  5. FFmpeg is included - no additional setup required!"
else
    echo "❌ Build failed!"
    exit 1
fi 