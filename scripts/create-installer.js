const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Creating ALL-DLP Installer Package\n');

// Configuration
const APP_NAME = 'ALL-DLP';
const BUNDLE_ID = 'com.all-dlp.app';
const VERSION = require('../package.json').version;
const INSTALLER_NAME = `ALL-DLP-${VERSION}-Installer`;

// Directories
const DIST_DIR = path.join(__dirname, '..', 'dist');
const MAC_DIR = path.join(DIST_DIR, 'mac');
const INSTALLER_DIR = path.join(DIST_DIR, 'installer');
const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts', 'installer');

// Ensure directories exist
[INSTALLER_DIR, SCRIPTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Find the app bundle
function findAppBundle() {
  if (!fs.existsSync(MAC_DIR)) {
    throw new Error('Mac build directory not found. Run npm run dist first.');
  }
  
  const files = fs.readdirSync(MAC_DIR);
  const appBundle = files.find(file => file.endsWith('.app'));
  
  if (!appBundle) {
    throw new Error('No .app bundle found in dist/mac');
  }
  
  return path.join(MAC_DIR, appBundle);
}

// Create installer scripts
function createInstallerScripts() {
  console.log('📝 Creating installer scripts...');
  
  // Preinstall script
  const preinstallScript = `#!/bin/bash
# Preinstall script for ALL-DLP

echo "🔧 ALL-DLP Installer - Pre-installation Setup"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This installer must be run as root (use sudo)"
  exit 1
fi

# Check macOS version
MACOS_VERSION=$(sw_vers -productVersion)
echo "📋 macOS Version: $MACOS_VERSION"

# Check architecture
ARCH=$(uname -m)
echo "🏗️  Architecture: $ARCH"

# Remove any existing installation
if [ -d "/Applications/${APP_NAME}.app" ]; then
  echo "🗑️  Removing existing installation..."
  rm -rf "/Applications/${APP_NAME}.app"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p "/Library/Application Support/${APP_NAME}"
mkdir -p "/Library/Logs/${APP_NAME}"

# Set proper permissions
chmod 755 "/Library/Application Support/${APP_NAME}"
chmod 755 "/Library/Logs/${APP_NAME}"

echo "✅ Pre-installation setup complete"
`;

  // Postinstall script
  const postinstallScript = `#!/bin/bash
# Postinstall script for ALL-DLP

echo "🔧 ALL-DLP Installer - Post-installation Setup"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This installer must be run as root (use sudo)"
  exit 1
fi

# Set proper ownership and permissions
echo "🔐 Setting permissions..."
chown -R root:wheel "/Applications/${APP_NAME}.app"
chmod -R 755 "/Applications/${APP_NAME}.app"

# Remove quarantine attributes
echo "🚫 Removing quarantine attributes..."
xattr -cr "/Applications/${APP_NAME}.app" 2>/dev/null || true

# Create user directories
for USER_HOME in /Users/*; do
  if [ -d "$USER_HOME" ]; then
    USERNAME=$(basename "$USER_HOME")
    if [ "$USERNAME" != "Shared" ]; then
      echo "👤 Setting up for user: $USERNAME"
      
      # Create user-specific directories
      mkdir -p "$USER_HOME/.all-dlp"
      mkdir -p "$USER_HOME/Downloads/all-dlp"
      
      # Set ownership
      chown -R "$USERNAME:staff" "$USER_HOME/.all-dlp"
      chown -R "$USERNAME:staff" "$USER_HOME/Downloads/all-dlp"
      
      # Set permissions
      chmod 755 "$USER_HOME/.all-dlp"
      chmod 755 "$USER_HOME/Downloads/all-dlp"
    fi
  fi
done

# Create launch agent for auto-start (optional)
LAUNCH_AGENT_DIR="/Library/LaunchAgents"
LAUNCH_AGENT_PLIST="$LAUNCH_AGENT_DIR/${BUNDLE_ID}.plist"

if [ ! -f "$LAUNCH_AGENT_PLIST" ]; then
  echo "🚀 Creating launch agent..."
  cat > "$LAUNCH_AGENT_PLIST" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${BUNDLE_ID}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/${APP_NAME}.app/Contents/MacOS/${APP_NAME}</string>
    </array>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
EOF
  chmod 644 "$LAUNCH_AGENT_PLIST"
  chown root:wheel "$LAUNCH_AGENT_PLIST"
fi

# Create uninstaller
UNINSTALLER="/Applications/${APP_NAME}.app/Contents/Resources/uninstall.sh"
cat > "$UNINSTALLER" << 'EOF'
#!/bin/bash
# ALL-DLP Uninstaller

echo "🗑️  ALL-DLP Uninstaller"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ This uninstaller must be run as root (use sudo)"
  exit 1
fi

# Remove the app
if [ -d "/Applications/ALL-DLP.app" ]; then
  echo "🗑️  Removing ALL-DLP application..."
  rm -rf "/Applications/ALL-DLP.app"
fi

# Remove launch agent
if [ -f "/Library/LaunchAgents/com.all-dlp.app.plist" ]; then
  echo "🚫 Removing launch agent..."
  rm -f "/Library/LaunchAgents/com.all-dlp.app.plist"
fi

# Remove user data (ask for confirmation)
echo "📁 Remove user data? (y/N)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
  for USER_HOME in /Users/*; do
    if [ -d "$USER_HOME" ]; then
      USERNAME=$(basename "$USER_HOME")
      if [ "$USERNAME" != "Shared" ]; then
        echo "🗑️  Removing data for user: $USERNAME"
        rm -rf "$USER_HOME/.all-dlp"
        rm -rf "$USER_HOME/Downloads/all-dlp"
      fi
    fi
  done
fi

# Remove system directories
if [ -d "/Library/Application Support/ALL-DLP" ]; then
  echo "🗑️  Removing system directories..."
  rm -rf "/Library/Application Support/ALL-DLP"
fi

if [ -d "/Library/Logs/ALL-DLP" ]; then
  rm -rf "/Library/Logs/ALL-DLP"
fi

echo "✅ ALL-DLP has been uninstalled"
EOF

chmod +x "$UNINSTALLER"

echo "✅ Post-installation setup complete"
echo ""
echo "🎉 ALL-DLP has been installed successfully!"
echo ""
echo "📋 Installation Summary:"
echo "   • Application: /Applications/${APP_NAME}.app"
echo "   • User Data: ~/.all-dlp/"
echo "   • Downloads: ~/Downloads/all-dlp/"
echo "   • Uninstaller: /Applications/${APP_NAME}.app/Contents/Resources/uninstall.sh"
echo ""
echo "🚀 You can now launch ALL-DLP from Applications or Spotlight"
`;

  // Write scripts
  fs.writeFileSync(path.join(SCRIPTS_DIR, 'preinstall'), preinstallScript);
  fs.writeFileSync(path.join(SCRIPTS_DIR, 'postinstall'), postinstallScript);
  
  // Make scripts executable
  execSync(`chmod +x "${path.join(SCRIPTS_DIR, 'preinstall')}"`);
  execSync(`chmod +x "${path.join(SCRIPTS_DIR, 'postinstall')}"`);
  
  console.log('✅ Installer scripts created');
}

// Create distribution XML
function createDistributionXML() {
  console.log('📋 Creating distribution XML...');
  
  const distributionXML = `<?xml version="1.0" encoding="utf-8"?>
<installer-gui-script minSpecVersion="1">
    <title>ALL-DLP Installer</title>
    <organization>ALL-DLP</organization>
    <domains enable_localSystem="true"/>
    <options customize="never" require-scripts="true" rootVolumeOnly="true"/>
    
    <!-- Welcome -->
    <welcome file="welcome.html" mime-type="text/html"/>
    
    <!-- License -->
    <license file="license.html" mime-type="text/html"/>
    
    <!-- Installation -->
    <pkg-ref id="${BUNDLE_ID}" version="${VERSION}" onConclusion="none">component.pkg</pkg-ref>
    <choices-outline>
        <line choice="${BUNDLE_ID}"/>
    </choices-outline>
    <choice id="${BUNDLE_ID}" title="ALL-DLP">
        <pkg-ref id="${BUNDLE_ID}"/>
    </choice>
    
    <!-- Installation location -->
    <volume-check>
        <allowed-os-versions>
            <os-version min="10.15"/>
        </allowed-os-versions>
    </volume-check>
    
    <!-- Installation -->
    <installation-check script="installation_check.js"/>
    
    <!-- Scripts -->
    <script>
        function installation_check() {
            // Check if running on supported macOS
            var systemVersion = system.version.ProductVersion;
            var majorVersion = parseInt(systemVersion.split('.')[0]);
            var minorVersion = parseInt(systemVersion.split('.')[1]);
            
            if (majorVersion &lt; 10 || (majorVersion === 10 &amp;&amp; minorVersion &lt; 15)) {
                my.result.message = "ALL-DLP requires macOS 10.15 or later.";
                my.result.type = "Fatal";
                return false;
            }
            
            // Check architecture
            var architecture = system.architecture;
            if (architecture !== "x86_64" &amp;&amp; architecture !== "arm64") {
                my.result.message = "ALL-DLP requires Intel (x86_64) or Apple Silicon (arm64) architecture.";
                my.result.type = "Fatal";
                return false;
            }
            
            return true;
        }
    </script>
</installer-gui-script>`;

  fs.writeFileSync(path.join(INSTALLER_DIR, 'distribution.xml'), distributionXML);
  console.log('✅ Distribution XML created');
}

// Create welcome and license HTML files
function createHTMLFiles() {
  console.log('📄 Creating HTML files...');
  
  const welcomeHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to ALL-DLP</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; }
        h1 { color: #007AFF; }
        .feature { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
        .warning { color: #FF3B30; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🎵 Welcome to ALL-DLP</h1>
    
    <p>ALL-DLP is a powerful desktop application for downloading music from various platforms.</p>
    
    <h2>✨ Features:</h2>
    <div class="feature">🎯 <strong>Multi-Platform Support:</strong> Download from YouTube, Spotify, SoundCloud, and more</div>
    <div class="feature">🔍 <strong>Music Search:</strong> Find legal purchase options for your favorite songs</div>
    <div class="feature">📁 <strong>Organized Downloads:</strong> Automatic file organization and metadata extraction</div>
    <div class="feature">🚀 <strong>Fast Downloads:</strong> Optimized for speed and reliability</div>
    <div class="feature">💻 <strong>Cross-Architecture:</strong> Works on Intel and Apple Silicon Macs</div>
    
    <h2>⚠️ Important Notes:</h2>
    <div class="warning">
        • This application is for <strong>personal, private use only</strong><br>
        • Respect copyright and terms of service<br>
        • Only download content you have the right to access<br>
        • Support artists by purchasing music when possible
    </div>
    
    <h2>🔧 System Requirements:</h2>
    <ul>
        <li>macOS 10.15 (Catalina) or later</li>
        <li>Intel (x86_64) or Apple Silicon (arm64) processor</li>
        <li>Internet connection for downloads</li>
        <li>At least 100MB free disk space</li>
    </ul>
    
    <p><strong>Click Continue to begin the installation.</strong></p>
</body>
</html>`;

  const licenseHTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ALL-DLP License Agreement</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; }
        h1 { color: #007AFF; }
        .license-text { background: #f5f5f5; padding: 20px; border-radius: 5px; max-height: 400px; overflow-y: auto; }
    </style>
</head>
<body>
    <h1>📄 License Agreement</h1>
    
    <div class="license-text">
        <h2>MIT License</h2>
        
        <p>Copyright (c) 2024 ALL-DLP</p>
        
        <p>Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:</p>
        
        <p>The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.</p>
        
        <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
        SOFTWARE.</p>
        
        <h3>Additional Terms:</h3>
        <ul>
            <li>This software is provided for personal, private use only</li>
            <li>Users are responsible for complying with all applicable laws and terms of service</li>
            <li>The developers are not responsible for any misuse of this software</li>
            <li>Respect copyright and support content creators</li>
        </ul>
    </div>
    
    <p><strong>By clicking Agree, you accept the terms of this license agreement.</strong></p>
</body>
</html>`;

  fs.writeFileSync(path.join(INSTALLER_DIR, 'welcome.html'), welcomeHTML);
  fs.writeFileSync(path.join(INSTALLER_DIR, 'license.html'), licenseHTML);
  console.log('✅ HTML files created');
}

// Create the installer package
function createInstallerPackage() {
  console.log('📦 Creating installer package...');
  
  const appBundle = findAppBundle();
  const pkgPath = path.join(INSTALLER_DIR, `${INSTALLER_NAME}.pkg`);
  
  // Create component package
  const componentPkg = path.join(INSTALLER_DIR, 'component.pkg');
  
  const pkgbuildCmd = [
    'pkgbuild',
    '--root', path.dirname(appBundle),
    '--component-plist', path.join(SCRIPTS_DIR, 'component.plist'),
    '--scripts', SCRIPTS_DIR,
    '--install-location', '/Applications',
    componentPkg
  ].join(' ');
  
  console.log(`🔨 Running: ${pkgbuildCmd}`);
  execSync(pkgbuildCmd);
  
  // Create distribution package
  const productbuildCmd = [
    'productbuild',
    '--distribution', path.join(INSTALLER_DIR, 'distribution.xml'),
    '--resources', INSTALLER_DIR,
    '--package-path', INSTALLER_DIR,
    pkgPath
  ].join(' ');
  
  console.log(`🔨 Running: ${productbuildCmd}`);
  execSync(productbuildCmd);
  
  // Clean up component package
  fs.unlinkSync(componentPkg);
  
  console.log(`✅ Installer created: ${pkgPath}`);
  return pkgPath;
}

// Create component plist
function createComponentPlist() {
  console.log('📋 Creating component plist...');
  
  const componentPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
    <dict>
        <key>BundleHasStrictIdentifier</key>
        <true/>
        <key>BundleIsRelocatable</key>
        <false/>
        <key>BundleIsVersionChecked</key>
        <true/>
        <key>BundleOverwriteAction</key>
        <string>upgrade</string>
        <key>RootRelativeBundlePath</key>
        <string>${APP_NAME}.app</string>
    </dict>
</array>
</plist>`;

  fs.writeFileSync(path.join(SCRIPTS_DIR, 'component.plist'), componentPlist);
  console.log('✅ Component plist created');
}

// Main execution
try {
  console.log('🚀 Starting installer creation...\n');
  
  // Create all necessary files
  createInstallerScripts();
  createComponentPlist();
  createDistributionXML();
  createHTMLFiles();
  
  // Create the installer package
  const installerPath = createInstallerPackage();
  
  console.log('\n🎉 Installer creation completed successfully!');
  console.log(`📦 Installer location: ${installerPath}`);
  console.log(`📏 Installer size: ${(fs.statSync(installerPath).size / (1024 * 1024)).toFixed(2)} MB`);
  
  console.log('\n📋 Installation Instructions:');
  console.log('1. Double-click the installer package');
  console.log('2. Follow the installation wizard');
  console.log('3. The installer will handle all compatibility issues automatically');
  console.log('4. Launch ALL-DLP from Applications');
  
  console.log('\n🔧 Uninstallation:');
  console.log('Run: sudo /Applications/ALL-DLP.app/Contents/Resources/uninstall.sh');
  
} catch (error) {
  console.error('❌ Error creating installer:', error.message);
  process.exit(1);
} 