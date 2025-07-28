const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Creating ALL-DLP bundle...\n');

// Detect current architecture
const os = require('os');
const arch = os.arch();
const venvDir = arch === 'x64' ? 'venv-x64' : 'venv-arm64';

console.log(`🎯 Detected architecture: ${arch} (using ${venvDir})`);

async function createBundle() {
  try {
    // Check if virtual environment exists
    if (!fs.existsSync(venvDir)) {
      console.error(`❌ Virtual environment not found: ${venvDir}`);
      console.error('Please run setup.sh first: ./setup.sh');
      process.exit(1);
    }

    // Check if API directory exists
    if (!fs.existsSync('api')) {
      console.error('❌ API directory not found');
      process.exit(1);
    }

    // Check if FFmpeg exists
    if (!fs.existsSync('api/ffmpeg')) {
      console.log('📥 Downloading FFmpeg...');
      execSync('npm run download-ffmpeg', { stdio: 'inherit' });
    }

    console.log('🐍 Step 1: Building Python API server...');
    
    // Build the Python API server using PyInstaller
    execSync('npm run bundle-python', { stdio: 'inherit' });

    console.log('📦 Step 2: Creating launcher script...');
    
    const launcherContent = `#!/bin/bash
SCRIPT_DIR="\\$(dirname "\\$0")"
cd "\\$SCRIPT_DIR"

# Start the bundled API server
"\\$SCRIPT_DIR/all-dlp-api/all-dlp-api"
`;

    fs.writeFileSync('dist/launcher.sh', launcherContent);
    execSync('chmod +x dist/launcher.sh', { stdio: 'inherit' });

    console.log('📝 Step 3: Creating start script...');
    
    const startContent = `#!/bin/bash
SCRIPT_DIR="\\$(dirname "\\$0")"
cd "\\$SCRIPT_DIR"

# Start API server
"\\$SCRIPT_DIR/all-dlp-api/all-dlp-api"
`;

    fs.writeFileSync('dist/start.sh', startContent);
    execSync('chmod +x dist/start.sh', { stdio: 'inherit' });

    console.log('🎯 Step 4: Creating installer package...');
    
    const installerScript = `#!/bin/bash
# ALL-DLP Installer
echo "Installing ALL-DLP..."

# Create application directory
APP_DIR="/Applications/ALL-DLP.app/Contents/Resources"
sudo mkdir -p "\\$APP_DIR"

# Copy bundle files
sudo cp -r dist/* "\\$APP_DIR/"

# Set permissions
sudo chmod +x "\\$APP_DIR/launcher.sh"
sudo chmod +x "\\$APP_DIR/start.sh"
sudo chown -R root:wheel "\\$APP_DIR"

echo "Installation complete!"
echo "You can now run: /Applications/ALL-DLP.app/Contents/Resources/launcher.sh"
`;
    
    fs.writeFileSync('dist/install.sh', installerScript);
    execSync('chmod +x dist/install.sh', { stdio: 'inherit' });

    console.log('✅ Bundle created successfully!');
    console.log(`📂 Bundle location: ${path.resolve('dist')}`);
    console.log('🚀 To install: sudo ./dist/install.sh');
    console.log('🎵 To start API server: ./dist/start.sh');
    
  } catch (error) {
    console.error('❌ Error creating bundle:', error.message);
    process.exit(1);
  }
}

createBundle(); 