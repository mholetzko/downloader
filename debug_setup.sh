#!/bin/bash

echo "=== bB-downloader Debug Setup ==="

# Check if we're in the right directory
if [ ! -f "api_server.py" ]; then
    echo "Error: api_server.py not found. Please run this script from the electron-app directory."
    exit 1
fi

echo "1. Checking Python virtual environment..."
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "2. Activating virtual environment..."
source venv/bin/activate

echo "3. Installing dependencies..."
pip install -r requirements.txt

echo "4. Checking if yt-dlp is available..."
if command -v yt-dlp &> /dev/null; then
    echo "✓ yt-dlp is available"
else
    echo "✗ yt-dlp not found in PATH"
    echo "Installing yt-dlp..."
    pip install yt-dlp
fi

echo "5. Checking if spotdl is available..."
if command -v spotdl &> /dev/null; then
    echo "✓ spotdl is available"
else
    echo "✗ spotdl not found in PATH"
    echo "Installing spotdl..."
    pip install spotdl
fi

echo "6. Checking if scdl is available..."
if command -v scdl &> /dev/null; then
    echo "✓ scdl is available"
else
    echo "✗ scdl not found in PATH"
    echo "Installing scdl..."
    pip install scdl
fi

echo "7. Testing API server startup..."
echo "Starting API server in background..."
python api_server.py &
API_PID=$!

# Wait for server to start
sleep 3

echo "8. Testing API endpoints..."
python test_api.py

echo "9. Stopping API server..."
kill $API_PID 2>/dev/null

echo "=== Debug setup completed ==="
echo ""
echo "If the test passed, the API server should work correctly."
echo "If there were errors, check the output above for issues."
echo ""
echo "To start the Electron app:"
echo "npm start" 