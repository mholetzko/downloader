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
python api/api_server.py

# In another terminal, start the Electron app
npm start
```

## 🚀 **Building Your Own Installer**

If you want to create your own self-contained installer:

```bash
# Install all dependencies
npm install
pip install -r api/requirements.txt

# Create the complete installer
npm run installer
```