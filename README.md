# 🎵 bB Downloader

**Download music from YouTube, Spotify, and SoundCloud with ease**

A beautiful, privacy-focused desktop application that lets you download high-quality MP3 files from your favorite music platforms. Built with modern technologies and designed for simplicity.

![bB Downloader Main Interface](docs/main-ui.png)

## ✨ Features

### 🎯 **Core Functionality**
- **YouTube Music** - Download any YouTube video as MP3
- **Spotify Tracks** - Convert Spotify links to downloadable audio
- **SoundCloud Audio** - Download SoundCloud tracks and playlists
- **High Quality** - All downloads converted to MP3 with FFmpeg
- **Smart Naming** - Files saved with original titles and unique IDs

### 🎨 **User Experience**
- **Modern Interface** - Clean, responsive design with dark theme
- **Real-time Progress** - Live download status and progress bars
- **Download History** - Track all your downloads with status
- **File Management** - Direct access to downloaded files
- **System Status** - Monitor API server and tool availability

### 🔒 **Privacy & Security**
- **Local Processing** - All downloads happen on your device
- **No Data Collection** - We don't store or transmit your data
- **Open Source** - Transparent code you can inspect
- **Offline Capable** - Works without internet after setup

### 🚀 **Advanced Features**
- **Playlist Support** - Download entire playlists automatically
- **Error Recovery** - Automatic retry and error handling
- **File Verification** - Ensures downloads complete successfully
- **Cross-Platform** - Works on macOS, Windows, and Linux

## 🎯 Quick Start

### For Users
1. **Download** the latest release for your platform
2. **Install** the application
3. **Paste a URL** from YouTube, Spotify, or SoundCloud
4. **Click Download** and enjoy your music!

### For Developers
```bash
# Clone the repository
git clone https://github.com/mholetzko/downloader.git
cd downloader/electron-app

# Install dependencies
npm install
pip install -r api/requirements.txt

# Start development
npm run dev
```

## 📱 Supported Platforms

| Platform | Status | Download |
|----------|--------|----------|
| **macOS** | ✅ Ready | [Latest Release](https://github.com/mholetzko/downloader/releases) |
| **Windows** | 🚧 Coming Soon | - |
| **Linux** | 🚧 Coming Soon | - |

## 🎵 Supported Services

### YouTube
- ✅ **Music videos**
- ✅ **Audio-only content**
- ✅ **Playlists** (coming soon)
- ✅ **High quality audio**

### Spotify
- ✅ **Individual tracks**
- ✅ **Playlists** (with rate limiting)
- ✅ **Album tracks**
- ⚠️ **Rate limited** - may take longer

### SoundCloud
- ✅ **Public tracks**
- ✅ **Public playlists**
- ✅ **High quality audio**
- ⚠️ **Public content only**

## 📁 File Organization

Downloaded files are automatically organized in your Downloads folder:

```
~/Downloads/bB-downloader/
├── Song Title-abc123.mp3
├── Another Song-def456.mp3
└── Playlist Name/
    ├── Track 1-ghi789.mp3
    ├── Track 2-jkl012.mp3
    └── ...
```

## 🔧 System Requirements

- **Operating System**: macOS 10.15+ (Catalina or later)
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB free space
- **Internet**: Required for downloads
- **Permissions**: File system access for downloads

## 🆘 Getting Help

### Common Issues
- **App won't start**: Check if it's in Applications folder, right-click and "Open"
- **Downloads not working**: Ensure internet connection and API server is running
- **Permission errors**: Check system preferences for app permissions

### Support Resources
- 📖 **[Installation Guide](INSTALLATION_GUIDE.md)** - Detailed setup instructions
- 🔧 **[Troubleshooting](TROUBLESHOOTING.md)** - Common problems and solutions
- 📋 **[Changelog](CHANGELOG.md)** - Version history and updates

## 🛠️ Technical Documentation

For developers and contributors:

- **[Frontend Architecture](src/README.md)** - Electron app structure and components
- **[API Documentation](api/README.md)** - Python backend and endpoints
- **[Build Process](scripts/)** - Build scripts and automation

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **yt-dlp** - YouTube downloading engine
- **spotdl** - Spotify downloading library
- **scdl** - SoundCloud downloading tool
- **FFmpeg** - Audio processing and conversion
- **Electron** - Cross-platform desktop framework
- **FastAPI** - Modern Python web framework

## ☕ Support the Project

If you find this tool useful, consider buying us a coffee:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/mholetsgo)

---

**Made with ❤️ by Matthias Holetzko**

*Enjoy your music downloads! 🎵*
