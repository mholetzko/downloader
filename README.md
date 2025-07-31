# ALL-DLP

A desktop application that combines multiple download libraries into a single, simple UI for local music downloads.

## Features

- Download music from YouTube, Spotify, SoundCloud, and more
- Simple, unified interface for multiple platforms
- Local storage and organization
- Cross-platform support (macOS)

## Quick Start

### **For Users:**
1. **Download the installer** from the [Releases](https://github.com/your-username/ALL-DLP/releases) page
2. **Choose your architecture**:
   - **ARM64**: Apple Silicon (M1, M2, M3) - `ALL-DLP-*-Installer-arm64.pkg`
   - **x64**: Intel Macs - `ALL-DLP-*-Installer-x64.pkg`
3. **Run the installer**: Double-click the `.pkg` file and follow the wizard
4. **Launch ALL-DLP** from Applications
5. **Enter a URL** from a supported platform
6. **Downloads are saved** to `~/Downloads/all-dlp/`

### **For Developers:**
```bash
# Clone and setup
git clone https://github.com/your-username/ALL-DLP.git
cd ALL-DLP/electron-app
npm install
./setup.sh

# Build and create installer
npm run build
npm run create-installer

# Run locally
npm start
```

## Supported Platforms

- **YouTube**: Music videos and playlists
- **Spotify**: Tracks and playlists
- **SoundCloud**: Tracks and playlists

## System Requirements

- **macOS**: 11.0+ (Big Sur or later) for Apple Silicon, 10.15+ for Intel
- **Internet connection** for downloads

### 🔧 Apple Silicon Compatibility

ALL-DLP is built with universal compatibility for Apple Silicon (M1, M2, M3) chips. The installer automatically handles all compatibility issues, but if you encounter problems:

1. **Use the installer**: Download the `.pkg` installer instead of DMG
2. **Run compatibility check**: `npm run check-compatibility`
3. **Check Gatekeeper**: System Preferences → Security & Privacy
4. **Manual fix**: `xattr -cr /Applications/ALL-DLP.app`

## Legal Disclaimer

This application is intended for **personal, private use only**. Users are responsible for ensuring they have the right to download content. The developers are not liable for any misuse or illegal activities.

## Technical Documentation

- [API Documentation](api/README.md) - Backend API details
- [Frontend Architecture](src/README.md) - Electron app structure
- [Installer Guide](INSTALLER.md) - Professional installer system
- [Testing Guide](TESTING.md) - Comprehensive testing suite

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues or questions, please check the [troubleshooting guide](TROUBLESHOOTING.md) or create an issue on GitHub.
