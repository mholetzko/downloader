#!/bin/bash

echo "🎵 Building ALL-DLP..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the electron-app directory."
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

# Check if Python virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "⚠️  Virtual environment not found. Running setup..."
    ./setup.sh
fi

# Activate Python virtual environment
if [ -f "$VENV_DIR/bin/activate" ]; then
    echo "🐍 Activating Python virtual environment ($VENV_DIR)..."
    source "$VENV_DIR/bin/activate"
else
    echo "❌ $VENV_DIR/bin/activate not found!"
    echo "Please run: ./setup.sh"
    exit 1
fi

# Download FFmpeg if not already present
if [ ! -f "api/ffmpeg" ]; then
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
    echo "  - macOS ARM64: ALL-DLP-1.0.0-arm64.dmg"
    echo "  - macOS Intel: ALL-DLP-1.0.0-x64.dmg"
    echo ""
    echo "🎉 You can now distribute these .dmg files to users!"
    echo ""
    echo "📋 Installation instructions for users:"
    echo "  1. Download the appropriate .dmg file for their Mac"
    echo "  2. Double-click the .dmg file"
    echo "  3. Drag 'ALL-DLP' to Applications folder"
    echo "  4. Launch the app from Applications"
    echo "  5. FFmpeg is included - no additional setup required!"
else
    echo "❌ Build failed!"
    exit 1
fi 