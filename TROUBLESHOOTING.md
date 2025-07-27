# Troubleshooting Guide

## Download Button Freezes

If the download button freezes when clicked, here are the steps to diagnose and fix the issue:

### 1. Run the Debug Setup Script

First, run the debug setup script to check if everything is properly configured:

```bash
cd electron-app
./debug_setup.sh
```

This script will:
- Check and create the Python virtual environment
- Install all required dependencies
- Verify that yt-dlp, spotdl, and scdl are available
- Test the API server startup
- Test the API endpoints

### 2. Common Issues and Solutions

#### Issue: API Server Not Starting
**Symptoms**: The app starts but downloads don't work, or the API status shows "Not Running"

**Solutions**:
- Make sure you're in the `electron-app` directory when running the app
- Check that the virtual environment exists: `ls venv/`
- Reinstall dependencies: `pip install -r api/requirements.txt`
- Check Python version: `python --version` (should be 3.7+)

#### Issue: Missing Download Tools
**Symptoms**: Downloads fail with "Download failed" or "Downloaded file not found"

**Solutions**:
- Install yt-dlp: `pip install yt-dlp`
- Install spotdl: `pip install spotdl`
- Install scdl: `pip install scdl`
- Verify installation: `yt-dlp --version`, `spotdl --version`, `scdl --version`

#### Issue: Database Errors
**Symptoms**: App crashes or downloads don't save

**Solutions**:
- Check that the Downloads/bB-downloader directory exists
- Verify database permissions
- Delete the database file and restart: `rm ~/Downloads/bB-downloader/downloads.db`

#### Issue: Network/Proxy Issues
**Symptoms**: Downloads timeout or fail to start

**Solutions**:
- Check your internet connection
- If behind a proxy, configure it in the download tools
- Try a different URL to test

### 3. Manual Testing

If the debug script passes but the app still freezes, try manual testing:

1. Start the API server manually:
```bash
cd electron-app
source venv/bin/activate
python api/api_server.py
```

2. In another terminal, test the API:
```bash
curl http://127.0.0.1:8000/api/health
```

3. Test a download:
```bash
curl -X POST http://127.0.0.1:8000/api/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 4. Electron App Debugging

To debug the Electron app itself:

1. Open Developer Tools:
   - Press `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux)
   - Check the Console tab for errors

2. Check the main process logs:
   - Look for console output in the terminal where you started the app
   - Check for API server startup messages

3. Test IPC communication:
   - In the Developer Tools console, try: `window.electronAPI.checkApiStatus()`

### 5. Recent Fixes

The latest version includes these fixes for freezing issues:

- **Non-blocking downloads**: Downloads now run in background threads
- **Better error handling**: More detailed error messages and timeouts
- **API server readiness check**: The app waits for the API server to be ready
- **Timeout protection**: 30-second timeout on download requests

### 6. Still Having Issues?

If you're still experiencing problems:

1. Check the console output for specific error messages
2. Try with a simple YouTube URL first
3. Make sure all dependencies are up to date
4. Check if the issue occurs with all platforms (YouTube, Spotify, SoundCloud) or just one

### 7. Log Files

The app creates logs in:
- Main process: Terminal output where you started the app
- API server: Console output in the main process
- Database: `~/Downloads/bB-downloader/downloads.db`

Check these for detailed error information. 