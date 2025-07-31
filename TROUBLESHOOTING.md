# ALL-DLP Troubleshooting Guide

## 🔧 Common Issues and Solutions

### "App is Damaged" or "Corrupted" Error on macOS

**Problem**: The app shows as corrupted or damaged when trying to open it.

**Solutions**:

1. **Remove quarantine attributes**:
   ```bash
   xattr -cr /Applications/ALL-DLP.app
   ```

2. **Check Gatekeeper settings**:
   - Go to System Preferences → Security & Privacy
   - Click "Allow Anyway" for ALL-DLP

3. **Rebuild locally** (if you have the source code):
   ```bash
   npm run build
   ```

4. **Run compatibility check**:
   ```bash
   npm run check-compatibility
   ```

### Apple Silicon (M1/M2/M3) Compatibility Issues

**Problem**: App built on M3 shows as corrupted on M1.

**Solutions**:

1. **Use universal build settings**:
   - The app now uses universal ARM64 settings
   - Rebuild with: `npm run build`

2. **Check architecture compatibility**:
   ```bash
   file /Applications/ALL-DLP.app/Contents/MacOS/ALL-DLP
   ```

3. **Ensure macOS 11.0+** for Apple Silicon compatibility

### API Server Won't Start

**Problem**: The Python API server fails to start.

**Solutions**:

1. **Check Python environment**:
   ```bash
   python3 --version
   ```

2. **Reinstall dependencies**:
   ```bash
   ./setup.sh
   ```

3. **Check port availability**:
   ```bash
   lsof -i :8000
   ```

4. **Start API manually**:
   ```bash
   npm run start-api
   ```

### FFmpeg Not Found

**Problem**: Downloads fail due to missing FFmpeg.

**Solutions**:

1. **Install FFmpeg**:
   ```bash
   brew install ffmpeg
   ```

2. **Check FFmpeg installation**:
   ```bash
   which ffmpeg
   ffmpeg -version
   ```

3. **Rebuild with FFmpeg**:
   ```bash
   npm run download-ffmpeg
   npm run build
   ```

### Download Failures

**Problem**: Downloads fail or show errors.

**Solutions**:

1. **Check internet connection**

2. **Update download tools**:
   ```bash
   pip install --upgrade yt-dlp spotdl scdl
   ```

3. **Check URL format**:
   - YouTube: `https://www.youtube.com/watch?v=...`
   - Spotify: `https://open.spotify.com/track/...`
   - SoundCloud: `https://soundcloud.com/...`

4. **Check available disk space**

### Playlist Download Issues

**Problem**: Playlists download with wrong names or fail.

**Solutions**:

1. **Check playlist URL format**
2. **Ensure playlist is public** (for Spotify)
3. **Try downloading individual tracks first**
4. **Check playlist size** (very large playlists may timeout)

### Build Issues

**Problem**: Local build fails.

**Solutions**:

1. **Clean and rebuild**:
   ```bash
   rm -rf node_modules dist venv-*
   npm install
   ./setup.sh
   npm run build
   ```

2. **Check Node.js version**:
   ```bash
   node --version  # Should be 18+ or 20+
   ```

3. **Check Python version**:
   ```bash
   python3 --version  # Should be 3.11+
   ```

4. **Install system dependencies**:
   ```bash
   brew install ffmpeg
   ```

## 🔍 Diagnostic Commands

### System Information
```bash
# Check system architecture
uname -m

# Check macOS version
sw_vers

# Check available memory
system_profiler SPHardwareDataType
```

### Application Status
```bash
# Check if API server is running
curl http://localhost:8000/api/health

# Check application logs
tail -f ~/Downloads/all-dlp/all-dlp.log

# Check database
ls -la ~/.all-dlp/
```

### Compatibility Check
```bash
# Run full compatibility check
npm run check-compatibility

# Check specific components
file api/ffmpeg/ffmpeg
file dist/all-dlp-api/all-dlp-api
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check the logs**: `~/Downloads/all-dlp/all-dlp.log`
2. **Run diagnostics**: `npm run check-compatibility`
3. **Create an issue** on GitHub with:
   - System information
   - Error messages
   - Steps to reproduce
   - Log files

## 🔄 Reset and Reinstall

If all else fails:

1. **Remove the app**:
   ```bash
   rm -rf /Applications/ALL-DLP.app
   rm -rf ~/.all-dlp
   rm -rf ~/Downloads/all-dlp
   ```

2. **Clean build environment**:
   ```bash
   rm -rf node_modules dist venv-*
   ```

3. **Reinstall from scratch**:
   ```bash
   npm install
   ./setup.sh
   npm run build
   ``` 