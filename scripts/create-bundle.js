const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Creating self-contained bundle for Mac...\n');

// Configuration
const BUNDLE_DIR = 'bundle';
const PYTHON_VERSION = '3.11.7';
const PYTHON_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-macos11.pkg`;

async function createBundle() {
  try {
    // Clean and create bundle directory
    if (fs.existsSync(BUNDLE_DIR)) {
      fs.rmSync(BUNDLE_DIR, { recursive: true });
    }
    fs.mkdirSync(BUNDLE_DIR, { recursive: true });

    console.log('📦 Step 1: Downloading Python installer...');
    
    // Download Python installer
    const pythonInstallerPath = path.join(BUNDLE_DIR, 'python-installer.pkg');
    execSync(`curl -L -o "${pythonInstallerPath}" "${PYTHON_URL}"`, { stdio: 'inherit' });

    console.log('🐍 Step 2: Installing Python to bundle...');
    
    // Install Python to bundle directory
    const pythonBundlePath = path.join(BUNDLE_DIR, 'python');
    execSync(`pkgutil --expand "${pythonInstallerPath}" "${BUNDLE_DIR}/python-expanded"`, { stdio: 'inherit' });
    
    // Extract Python from the package
    execSync(`tar -xf "${BUNDLE_DIR}/python-expanded/Python.pkg/Payload" -C "${BUNDLE_DIR}"`, { stdio: 'inherit' });
    
    // Move Python to bundle/python
    if (fs.existsSync(path.join(BUNDLE_DIR, 'usr/local/bin'))) {
      fs.renameSync(path.join(BUNDLE_DIR, 'usr/local/bin'), pythonBundlePath);
    }

    console.log('📋 Step 3: Installing Python dependencies...');
    
    // Create virtual environment in bundle
    const venvPath = path.join(BUNDLE_DIR, 'venv');
    execSync(`${pythonBundlePath}/python3 -m venv "${venvPath}"`, { stdio: 'inherit' });
    
    // Install requirements
    const pipPath = path.join(venvPath, 'bin', 'pip');
    execSync(`${pipPath} install --upgrade pip`, { stdio: 'inherit' });
    execSync(`${pipPath} install -r requirements.txt`, { stdio: 'inherit' });
    execSync(`${pipPath} install scdl`, { stdio: 'inherit' });

    console.log('🔧 Step 4: Creating launcher script...');
    
    // Create launcher script
    const launcherScript = `#!/bin/bash
# bB Downloader Launcher
SCRIPT_DIR="\\$(cd "\\$(dirname "\\${BASH_SOURCE[0]}")" && pwd)"
export PATH="\\$SCRIPT_DIR/python:\\$PATH"
export PYTHONPATH="\\$SCRIPT_DIR/venv/lib/python3.11/site-packages"
"\\$SCRIPT_DIR/venv/bin/python" "\\$SCRIPT_DIR/api_server.py"
`;
    
    fs.writeFileSync(path.join(BUNDLE_DIR, 'launcher.sh'), launcherScript);
    execSync(`chmod +x "${BUNDLE_DIR}/launcher.sh"`, { stdio: 'inherit' });

    console.log('📁 Step 5: Copying application files...');
    
    // Copy application files
    const filesToCopy = [
      'api_server.py',
      'database.py',
      'requirements.txt',
      'ffmpeg'
    ];
    
    filesToCopy.forEach(file => {
      if (fs.existsSync(file)) {
        if (fs.statSync(file).isDirectory()) {
          execSync(`cp -r "${file}" "${BUNDLE_DIR}/"`, { stdio: 'inherit' });
        } else {
          execSync(`cp "${file}" "${BUNDLE_DIR}/"`, { stdio: 'inherit' });
        }
      }
    });

    console.log('🎯 Step 6: Creating installer package...');
    
    // Create installer package
    const installerScript = `#!/bin/bash
# bB Downloader Installer
echo "Installing bB Downloader..."

# Create application directory
APP_DIR="/Applications/bB Downloader.app/Contents/Resources"
sudo mkdir -p "\\$APP_DIR"

# Copy bundle files
sudo cp -r bundle/* "\\$APP_DIR/"

# Set permissions
sudo chmod +x "\\$APP_DIR/launcher.sh"
sudo chown -R root:wheel "\\$APP_DIR"

echo "Installation complete!"
echo "You can now run: /Applications/bB\\ Downloader.app/Contents/Resources/launcher.sh"
`;
    
    fs.writeFileSync(path.join(BUNDLE_DIR, 'install.sh'), installerScript);
    execSync(`chmod +x "${BUNDLE_DIR}/install.sh"`, { stdio: 'inherit' });

    console.log('✅ Bundle created successfully!');
    console.log(`📂 Bundle location: ${path.resolve(BUNDLE_DIR)}`);
    console.log('🚀 To install: sudo ./bundle/install.sh');
    
  } catch (error) {
    console.error('❌ Error creating bundle:', error.message);
    process.exit(1);
  }
}

createBundle(); 