# bB Downloader - Installation Guide

## 🎉 **Self-Contained Installer Available!**

We now provide a **completely self-contained installer** that includes all dependencies. No need to install Python or any external tools manually!

## 📦 **Quick Installation (Recommended)**

### **Option 1: DMG Installer (Easiest)**
1. Download `bB-Downloader-Installer.dmg`
2. Double-click to mount the DMG
3. Drag the app to Applications folder
4. Double-click the desktop shortcut to run

### **Option 2: Command Line Installer**
```bash
# Download and run the installer
sudo ./install-complete.sh
```

## 🔧 **Manual Installation (Advanced Users)**

If you prefer to install dependencies manually or are developing:

### **Prerequisites:**
- **Python 3.8+** (Download from [python.org](https://python.org))
- **FFmpeg** (`brew install ffmpeg` on macOS)

### **Python Dependencies:**
```bash
pip install fastapi uvicorn yt-dlp spotdl scdl python-multipart pydantic python-dotenv requests
```

### **Running the App:**
```bash
# Start the API server
python api_server.py

# In another terminal, start the Electron app
npm start
```

## 🚀 **Building Your Own Installer**

If you want to create your own self-contained installer:

```bash
# Install all dependencies
npm install
pip install -r requirements.txt

# Create the complete installer
npm run installer
```

This will create:
- `dist/bB-Downloader-Installer.dmg` - DMG installer
- `dist/install-complete.sh` - Command line installer

## 📋 **What's Included in the Self-Contained Installer**

✅ **Python 3.11** - Embedded Python runtime  
✅ **All Python Dependencies** - FastAPI, yt-dlp, spotdl, scdl, etc.  
✅ **FFmpeg** - Audio processing  
✅ **Electron App** - Desktop interface  
✅ **Database** - SQLite for download tracking  
✅ **Launcher Scripts** - Easy startup  

## 🎯 **System Requirements**

- **macOS 10.15+** (Catalina or later)
- **4GB RAM** minimum
- **500MB** disk space
- **Internet connection** for downloads

## 🔍 **Troubleshooting**

### **App won't start:**
1. Check if the app is in Applications folder
2. Right-click and select "Open" (bypasses Gatekeeper)
3. Check Console.app for error messages

### **Downloads not working:**
1. Ensure you have internet connection
2. Check if the API server is running (should start automatically)
3. Try restarting the app

### **Permission errors:**
```bash
# Fix permissions
sudo chmod +x "/Applications/bB Downloader.app/Contents/Resources/start.sh"
```

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Look for error messages in Console.app
3. Try the manual installation method
4. Report issues with system information and error logs

---

**Enjoy downloading your music! 🎵** 