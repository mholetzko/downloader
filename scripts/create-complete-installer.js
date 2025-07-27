const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Creating complete self-contained installer for Mac...\n');

async function createCompleteInstaller() {
  try {
    // Step 1: Build PyInstaller bundle
    console.log('📦 Step 1: Building Python backend with PyInstaller...');
    execSync('npm run bundle-python', { stdio: 'inherit' });

    // Step 2: Build Electron app
    console.log('⚡ Step 2: Building Electron app...');
    execSync('npm run dist', { stdio: 'inherit' });

    // Step 3: Create combined installer
    console.log('🔧 Step 3: Creating combined installer...');
    
    const installerScript = `#!/bin/bash
# bB Downloader Complete Installer
echo "Installing bB Downloader..."

# Create application directory
APP_DIR="/Applications/bB Downloader.app"
RESOURCES_DIR="\\$APP_DIR/Contents/Resources"
sudo mkdir -p "\\$RESOURCES_DIR"

# Copy Electron app
echo "Installing Electron app..."
sudo cp -r dist/mac-arm64/bB\\ Downloader.app/* "\\$APP_DIR/"

# Copy Python backend
echo "Installing Python backend..."
sudo cp -r dist/bb-downloader-api "\\$RESOURCES_DIR/"
sudo cp dist/launcher.sh "\\$RESOURCES_DIR/"

# Create startup script
echo "Creating startup script..."
sudo tee "\\$RESOURCES_DIR/start.sh" > /dev/null << 'EOF'
#!/bin/bash
# Start bB Downloader
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start Python API server in background
"$SCRIPT_DIR/bb-downloader-api/bb-downloader-api" &
API_PID=$!

# Wait for API to start
sleep 3

# Start Electron app
open "$SCRIPT_DIR/../MacOS/bB Downloader"

# Wait for user to close app
wait $API_PID
EOF

# Set permissions
sudo chmod +x "\\$RESOURCES_DIR/start.sh"
sudo chmod +x "\\$RESOURCES_DIR/launcher.sh"
sudo chmod +x "\\$RESOURCES_DIR/bb-downloader-api/bb-downloader-api"
sudo chown -R root:wheel "\\$APP_DIR"

# Create desktop shortcut
echo "Creating desktop shortcut..."
cat > ~/Desktop/bB\\ Downloader.command << EOF
#!/bin/bash
cd "/Applications/bB Downloader.app/Contents/Resources"
./start.sh
EOF

chmod +x ~/Desktop/bB\\ Downloader.command

echo "✅ Installation complete!"
echo "🎯 You can now:"
echo "   - Double-click the desktop shortcut"
echo "   - Or run: /Applications/bB\\ Downloader.app/Contents/Resources/start.sh"
echo "   - Or use the app from Applications folder"
`;

    fs.writeFileSync('dist/install-complete.sh', installerScript);
    execSync('chmod +x dist/install-complete.sh', { stdio: 'inherit' });

    // Create DMG installer
    console.log('📦 Step 4: Creating DMG installer...');
    
    const dmgScript = `#!/bin/bash
# Create DMG installer
echo "Creating DMG installer..."

# Create temporary directory
TEMP_DIR="/tmp/bb-downloader-installer"
rm -rf "\\$TEMP_DIR"
mkdir -p "\\$TEMP_DIR"

# Copy files to temp directory
cp -r dist/mac-arm64/bB\\ Downloader.app "\\$TEMP_DIR/"
cp dist/install-complete.sh "\\$TEMP_DIR/"
cp INSTALLATION_GUIDE.md "\\$TEMP_DIR/"

# Create DMG
hdiutil create -volname "bB Downloader" -srcfolder "\\$TEMP_DIR" -ov -format UDZO "dist/bB-Downloader-Installer.dmg"

echo "✅ DMG installer created: dist/bB-Downloader-Installer.dmg"
`;

    fs.writeFileSync('dist/create-dmg.sh', dmgScript);
    execSync('chmod +x dist/create-dmg.sh', { stdio: 'inherit' });
    execSync('./dist/create-dmg.sh', { stdio: 'inherit' });

    console.log('✅ Complete installer created successfully!');
    console.log('📂 Files created:');
    console.log('   - dist/install-complete.sh (Command line installer)');
    console.log('   - dist/bB-Downloader-Installer.dmg (DMG installer)');
    console.log('🚀 To install:');
    console.log('   - Double-click the DMG file');
    console.log('   - Or run: sudo ./dist/install-complete.sh');
    
  } catch (error) {
    console.error('❌ Error creating complete installer:', error.message);
    process.exit(1);
  }
}

createCompleteInstaller(); 