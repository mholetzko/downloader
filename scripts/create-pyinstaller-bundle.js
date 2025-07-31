const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Creating PyInstaller bundle for Mac...\n');

// Detect target architecture from system
let targetArch;
if (process.env.MATRIX_ARCH) {
  // Use CI/CD environment variable if available
  targetArch = process.env.MATRIX_ARCH;
  console.log(`🎯 Using CI/CD architecture: ${targetArch}`);
} else {
  // Detect from system
  const os = require('os');
  const systemArch = os.arch();
  targetArch = systemArch === 'x64' ? 'x64' : 'arm64';
  console.log(`🎯 Detected system architecture: ${systemArch} -> ${targetArch}`);
}

console.log(`🎯 Target architecture: ${targetArch}`);

// Use architecture-specific virtual environment
const venvBin = targetArch === 'x64' 
  ? path.join(__dirname, '..', 'venv-x64', 'bin')
  : path.join(__dirname, '..', 'venv-arm64', 'bin');

console.log(`🔧 Using virtual environment: ${venvBin}`);

// Check if virtual environment exists
if (!fs.existsSync(venvBin)) {
  console.error(`❌ Virtual environment not found: ${venvBin}`);
  console.error('Please run setup.sh first to create the virtual environment:');
  console.error('  ./setup.sh');
  process.exit(1);
}

// Check if pip exists in the virtual environment
const pipPath = path.join(venvBin, 'pip');
if (!fs.existsSync(pipPath)) {
  console.error(`❌ pip not found in virtual environment: ${pipPath}`);
  console.error('Virtual environment may be corrupted. Please run:');
  console.error('  ./setup.sh');
  process.exit(1);
}

console.log('📋 Step 1: Installing PyInstaller...');

try {
  const pipCmd = targetArch === 'x64' 
    ? 'arch -x86_64 venv-x64/bin/pip install pyinstaller'
    : 'venv-arm64/bin/pip install pyinstaller';
  
  console.log(`🔨 Installing PyInstaller: ${pipCmd}`);
  execSync(pipCmd, { stdio: 'inherit' });
} catch (error) {
  console.log('PyInstaller already installed or installation failed');
}

    console.log('📋 Step 2: Creating PyInstaller spec...');

// Check which tools are available
const availableTools = [];

// Check for FFmpeg
const ffmpegPath = path.join(__dirname, '..', 'api', 'ffmpeg');
if (fs.existsSync(ffmpegPath)) {
  availableTools.push("('api/ffmpeg', 'ffmpeg')");
  console.log('✅ FFmpeg found');
} else {
  console.log('⚠️  FFmpeg not found');
}

// Check for yt-dlp
const ytdlpPath = path.join(venvBin, 'yt-dlp');
if (fs.existsSync(ytdlpPath)) {
  const toolPath = targetArch === 'x64' ? 'venv-x64/bin/yt-dlp' : 'venv-arm64/bin/yt-dlp';
  availableTools.push(`('${toolPath}', 'yt-dlp')`);
  console.log('✅ yt-dlp found');
} else {
  console.log('⚠️  yt-dlp not found');
}

// Check for spotdl
const spotdlPath = path.join(venvBin, 'spotdl');
if (fs.existsSync(spotdlPath)) {
  const toolPath = targetArch === 'x64' ? 'venv-x64/bin/spotdl' : 'venv-arm64/bin/spotdl';
  availableTools.push(`('${toolPath}', 'spotdl')`);
  console.log('✅ spotdl found');
} else {
  console.log('⚠️  spotdl not found');
}

// Check for scdl
const scdlPath = path.join(venvBin, 'scdl');
if (fs.existsSync(scdlPath)) {
  const toolPath = targetArch === 'x64' ? 'venv-x64/bin/scdl' : 'venv-arm64/bin/scdl';
  availableTools.push(`('${toolPath}', 'scdl')`);
  console.log('✅ scdl found');
} else {
  console.log('⚠️  scdl not found');
}
    
    const specContent = `# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['api/api_server.py'],
    pathex=[],
    binaries=[
        ${availableTools.join(',\n        ')}
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
    name='all-dlp-api',
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
    name='all-dlp-api',
)
`;

fs.writeFileSync('all-dlp.spec', specContent);
console.log('📋 Step 3: Building PyInstaller bundle...');

try {
  // Use architecture-specific PyInstaller command with universal settings
  let pyinstallerCmd;
  let execOptions = { stdio: 'inherit' };
  
  if (targetArch === 'x64') {
    pyinstallerCmd = 'arch -x86_64 venv-x64/bin/pyinstaller all-dlp.spec';
  } else {
    // For ARM64, use universal settings for better M1/M2/M3 compatibility
    const env = { ...process.env };
    env.MACOSX_DEPLOYMENT_TARGET = '11.0';
    env.ARCHFLAGS = '-arch arm64';
    env._PYTHON_HOST_PLATFORM = 'macosx-11.0-arm64';
    
    pyinstallerCmd = 'venv-arm64/bin/pyinstaller all-dlp.spec';
    execOptions.env = env;
    console.log('🔧 Using universal ARM64 settings for M1/M2/M3 compatibility');
  }
  
  console.log(`🔨 Running: ${pyinstallerCmd}`);
  execSync(pyinstallerCmd, execOptions);
  console.log('✅ PyInstaller bundle created successfully!');
  console.log('📦 Bundle location: dist/all-dlp-api/');
} catch (error) {
  console.error('❌ Error creating PyInstaller bundle:', error.message);
  process.exit(1);
}

    // Create launcher script
console.log('📝 Step 4: Creating launcher script...');
    
    const launcherScript = `#!/bin/bash
# ALL-DLP Launcher
SCRIPT_DIR="\\$(dirname "\\$0")"
cd "\\$SCRIPT_DIR"

# Start the API server
./all-dlp-api/all-dlp-api
`;

// Create installer script
const installerScript = `#!/bin/bash
# ALL-DLP Installer
echo "Installing ALL-DLP..."

# Copy to Applications
APP_DIR="/Applications/ALL-DLP.app/Contents/Resources"
sudo mkdir -p "\\$APP_DIR"

# Copy the bundle
sudo cp -r dist/all-dlp-api "\\$APP_DIR/"

# Make executable
sudo chmod +x "\\$APP_DIR/all-dlp-api"

echo "✅ Installation complete!"
echo "You can now run: /Applications/ALL-DLP.app/Contents/Resources/launcher.sh"
`;

    fs.writeFileSync('dist/launcher.sh', launcherScript);
    execSync('chmod +x dist/launcher.sh', { stdio: 'inherit' });

    fs.writeFileSync('dist/install.sh', installerScript);
    execSync('chmod +x dist/install.sh', { stdio: 'inherit' });

    console.log('✅ PyInstaller bundle created successfully!');
console.log('📂 Bundle location: dist/all-dlp-api/');
    console.log('🚀 To install: sudo ./dist/install.sh');
    