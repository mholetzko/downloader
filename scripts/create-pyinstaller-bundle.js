const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Creating PyInstaller bundle for Mac...\n');

async function createPyInstallerBundle() {
  try {
    // Install PyInstaller if not already installed
    console.log('📦 Step 1: Installing PyInstaller...');
    execSync('pip3 install pyinstaller', { stdio: 'inherit' });

    // Create spec file for PyInstaller
    console.log('📋 Step 2: Creating PyInstaller spec...');
    
    const specContent = `# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['api/api_server.py'],
    pathex=[],
    binaries=[
        ('ffmpeg/ffmpeg', 'ffmpeg'),
        ('venv/bin/yt-dlp', 'yt-dlp'),
        ('venv/bin/spotdl', 'spotdl'),
        ('venv/bin/scdl', 'scdl'),
    ],
    datas=[
        ('api/database.py', '.'),
        ('api/requirements.txt', '.'),
    ],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'fastapi',
        'pydantic',
        'sqlite3',
        'threading',
        'subprocess',
        'pathlib',
        'uuid',
        'time',
        'os',
        'sys',
        'json',
        're',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='music-downloader-api',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='music-downloader-api',
)
`;

    fs.writeFileSync('music-downloader.spec', specContent);

    // Run PyInstaller
    console.log('📦 Step 3: Building PyInstaller bundle...');
    execSync('pyinstaller music-downloader.spec', { stdio: 'inherit' });

    // Create launcher script
    console.log('📝 Step 4: Creating launcher script...');
    
    const launcherScript = `#!/bin/bash
# Music Downloader Launcher
SCRIPT_DIR="\\$(cd "\\$(dirname "\\${BASH_SOURCE[0]}")" && pwd)"
cd "\\$SCRIPT_DIR"

# Start the API server
./music-downloader-api/music-downloader-api
`;

    // Create installer script
    const installerScript = `#!/bin/bash
# Music Downloader Installer
echo "Installing Music Downloader..."

# Copy to Applications
APP_DIR="/Applications/Music Downloader.app/Contents/Resources"
sudo mkdir -p "\\$APP_DIR"

# Copy the bundle
sudo cp -r dist/music-downloader-api "\\$APP_DIR/"

# Make executable
sudo chmod +x "\\$APP_DIR/music-downloader-api"

echo "✅ Installation complete!"
echo "You can now run: /Applications/Music\\ Downloader.app/Contents/Resources/launcher.sh"
`;

    fs.writeFileSync('dist/launcher.sh', launcherScript);
    execSync('chmod +x dist/launcher.sh', { stdio: 'inherit' });

    fs.writeFileSync('dist/install.sh', installerScript);
    execSync('chmod +x dist/install.sh', { stdio: 'inherit' });

    console.log('✅ PyInstaller bundle created successfully!');
    console.log('📂 Bundle location: dist/music-downloader-api/');
    console.log('🚀 To install: sudo ./dist/install.sh');
    
  } catch (error) {
    console.error('❌ Error creating PyInstaller bundle:', error.message);
    process.exit(1);
  }
}

createPyInstallerBundle(); 