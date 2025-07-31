# ALL-DLP Installer Guide

## 🎯 Why an Installer Instead of DMG?

The ALL-DLP installer package (`.pkg`) solves several critical issues that DMG files can't address:

### **🔧 Problems Solved:**

1. **"Corrupted" App Issues**: 
   - Automatically removes quarantine attributes (`xattr -cr`)
   - Sets proper permissions and ownership
   - Handles Gatekeeper compatibility

2. **Cross-Architecture Compatibility**:
   - Validates system requirements before installation
   - Ensures proper architecture detection
   - Handles M1/M2/M3 compatibility automatically

3. **User Experience**:
   - Professional installation wizard
   - Clear system requirements check
   - Automatic directory setup
   - Built-in uninstaller

4. **System Integration**:
   - Proper file permissions
   - User directory creation
   - Launch agent setup (optional)
   - System-wide installation

## 📦 Installer Features

### **🔍 Pre-Installation Checks:**
- macOS version validation (10.15+)
- Architecture compatibility (Intel/Apple Silicon)
- Root privileges verification
- Existing installation cleanup

### **📁 Automatic Setup:**
- Application installation to `/Applications`
- User data directories (`~/.all-dlp/`)
- Downloads directory (`~/Downloads/all-dlp/`)
- System directories (`/Library/Application Support/ALL-DLP/`)

### **🔐 Security & Permissions:**
- Quarantine attribute removal
- Proper file ownership (root:wheel)
- Correct executable permissions (755)
- User-specific directory permissions

### **🚀 Post-Installation:**
- Launch agent creation (optional)
- Uninstaller installation
- Installation summary
- Ready-to-use application

## 🛠️ Creating the Installer

### **Local Development:**
```bash
# Build the app first
npm run dist -- --mac --arm64 --dir

# Create installer
npm run create-installer
```

### **CI/CD Pipeline:**
The installer is automatically created in GitHub Actions:
- **Development builds**: `build-dmg.yml` → Creates installer artifacts
- **Release builds**: `release.yml` → Creates installer packages for release

### **Installer Location:**
```
dist/installer/ALL-DLP-{VERSION}-Installer.pkg
```

## 📋 Installation Process

### **1. Download & Run:**
```bash
# Download the installer for your architecture
# ARM64: ALL-DLP-1.5.0-Installer-arm64.pkg
# x64: ALL-DLP-1.5.0-Installer-x64.pkg

# Double-click to run, or use command line:
sudo installer -pkg ALL-DLP-1.5.0-Installer.pkg -target /
```

### **2. Installation Wizard:**
1. **Welcome Screen**: Application overview and features
2. **License Agreement**: MIT License with additional terms
3. **System Check**: Automatic compatibility validation
4. **Installation**: Progress bar and status updates
5. **Completion**: Installation summary and next steps

### **3. What Gets Installed:**
```
/Applications/ALL-DLP.app                    # Main application
~/.all-dlp/                                   # User configuration
~/Downloads/all-dlp/                          # Download directory
/Library/Application Support/ALL-DLP/         # System support files
/Library/Logs/ALL-DLP/                        # System logs
/Library/LaunchAgents/com.all-dlp.app.plist  # Launch agent (optional)
```

## 🔧 Uninstallation

### **Using the Built-in Uninstaller:**
```bash
sudo /Applications/ALL-DLP.app/Contents/Resources/uninstall.sh
```

### **Manual Uninstallation:**
```bash
# Remove application
sudo rm -rf /Applications/ALL-DLP.app

# Remove launch agent
sudo rm -f /Library/LaunchAgents/com.all-dlp.app.plist

# Remove system directories
sudo rm -rf "/Library/Application Support/ALL-DLP"
sudo rm -rf "/Library/Logs/ALL-DLP"

# Remove user data (optional)
rm -rf ~/.all-dlp
rm -rf ~/Downloads/all-dlp
```

## 🏗️ Architecture Support

### **Apple Silicon (ARM64):**
- **M1, M2, M3**: Full native support
- **Universal compatibility**: Works across all Apple Silicon generations
- **Optimized performance**: Native ARM64 binaries

### **Intel (x64):**
- **Rosetta 2**: Automatic translation layer
- **Legacy support**: Works on older Intel Macs
- **Cross-compilation**: Built specifically for x64

### **System Requirements:**
- **macOS**: 10.15 (Catalina) or later
- **Architecture**: Intel (x86_64) or Apple Silicon (arm64)
- **Storage**: 100MB free space
- **Memory**: 4GB RAM recommended
- **Network**: Internet connection for downloads

## 🔍 Installer Scripts

### **Preinstall Script:**
```bash
# Checks system compatibility
# Removes existing installations
# Creates necessary directories
# Sets initial permissions
```

### **Postinstall Script:**
```bash
# Sets proper ownership and permissions
# Removes quarantine attributes
# Creates user directories
# Sets up launch agent
# Installs uninstaller
```

### **Uninstaller Script:**
```bash
# Removes application
# Cleans up system directories
# Removes launch agent
# Optionally removes user data
```

## 🚀 Launch Agent

The installer optionally creates a launch agent for system integration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.all-dlp.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/ALL-DLP.app/Contents/MacOS/ALL-DLP</string>
    </array>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
```

## 🔐 Security Features

### **Gatekeeper Compatibility:**
- Removes quarantine attributes automatically
- Sets proper code signing expectations
- Handles macOS security policies

### **File Permissions:**
- Application: `root:wheel` ownership, `755` permissions
- User directories: User ownership, `755` permissions
- System directories: `root:wheel` ownership, `755` permissions

### **Quarantine Handling:**
```bash
# Automatically executed during installation
xattr -cr "/Applications/ALL-DLP.app"
```

## 📊 Installer Statistics

### **File Sizes:**
- **ARM64 Installer**: ~300MB
- **x64 Installer**: ~280MB
- **Components**: Application bundle + Python backend + FFmpeg

### **Installation Time:**
- **First-time**: 30-60 seconds
- **Updates**: 15-30 seconds
- **Uninstallation**: 5-10 seconds

### **Disk Usage:**
- **Application**: ~200MB
- **User data**: Variable (downloads, cache)
- **System support**: ~50MB

## 🐛 Troubleshooting

### **Installation Fails:**
```bash
# Check system requirements
sw_vers -productVersion  # Should be 10.15+
uname -m                 # Should be x86_64 or arm64

# Check permissions
ls -la /Applications/    # Should be writable

# Check disk space
df -h /Applications      # Should have 100MB+ free
```

### **"Corrupted" App After Installation:**
```bash
# The installer should handle this automatically
# If issues persist:
sudo xattr -cr /Applications/ALL-DLP.app
sudo chmod +x /Applications/ALL-DLP.app/Contents/MacOS/ALL-DLP
```

### **Permission Issues:**
```bash
# Fix ownership
sudo chown -R root:wheel /Applications/ALL-DLP.app

# Fix permissions
sudo chmod -R 755 /Applications/ALL-DLP.app
```

### **User Directory Issues:**
```bash
# Recreate user directories
mkdir -p ~/.all-dlp
mkdir -p ~/Downloads/all-dlp
chmod 755 ~/.all-dlp
chmod 755 ~/Downloads/all-dlp
```

## 🔄 Updates

### **Automatic Updates:**
- The installer handles updates automatically
- Existing installations are replaced cleanly
- User data is preserved during updates

### **Manual Updates:**
```bash
# Download new installer
# Run installer (will replace existing installation)
# User data and settings are preserved
```

## 📈 Benefits Over DMG

| Feature | DMG | Installer (.pkg) |
|---------|-----|------------------|
| **Corrupted App Fix** | Manual (`xattr -cr`) | Automatic |
| **Permissions** | Manual setup | Automatic |
| **User Directories** | Manual creation | Automatic |
| **System Integration** | None | Launch agent, system dirs |
| **Uninstallation** | Manual cleanup | Built-in uninstaller |
| **Updates** | Manual replacement | Automatic handling |
| **Cross-Architecture** | Manual validation | Built-in checks |
| **User Experience** | Drag & drop | Professional wizard |

## 🎯 Best Practices

### **For Users:**
1. **Download the correct architecture**: ARM64 for Apple Silicon, x64 for Intel
2. **Run installer as administrator**: Required for system installation
3. **Follow the wizard**: All steps are important for proper setup
4. **Use built-in uninstaller**: Ensures complete cleanup

### **For Developers:**
1. **Test both architectures**: Ensure compatibility across platforms
2. **Validate installer**: Test installation and uninstallation
3. **Check permissions**: Verify proper file ownership and permissions
4. **Monitor installer size**: Keep it reasonable for downloads

### **For CI/CD:**
1. **Build both architectures**: ARM64 and x64 installers
2. **Test installer creation**: Ensure scripts work correctly
3. **Upload artifacts**: Make installers available for users
4. **Document releases**: Clear installation instructions

## 🚀 Future Enhancements

### **Planned Features:**
- **Silent installation**: Command-line options for automation
- **Custom installation paths**: User-selectable installation location
- **Component selection**: Optional features installation
- **Rollback support**: Automatic backup and restore
- **Update notifications**: Built-in update checking

### **Advanced Features:**
- **Code signing**: Developer ID and notarization
- **Delta updates**: Incremental installation packages
- **Multi-user support**: System-wide installation with user isolation
- **Configuration profiles**: Enterprise deployment support

The installer system provides a professional, reliable, and user-friendly way to distribute ALL-DLP, solving the "corrupted app" issues and providing a much better user experience than traditional DMG files! 🎵 