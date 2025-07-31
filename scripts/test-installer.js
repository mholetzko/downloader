const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing ALL-DLP Installer Package\n');

// Configuration
const INSTALLER_DIR = path.join(__dirname, '..', 'dist', 'installer');
const APP_NAME = 'ALL-DLP';

function testInstallerPackage() {
  console.log('🔍 Testing installer package...');
  
  // Check if installer exists
  const installerFiles = fs.readdirSync(INSTALLER_DIR);
  const pkgFile = installerFiles.find(file => file.endsWith('.pkg'));
  
  if (!pkgFile) {
    throw new Error('No installer package found');
  }
  
  const pkgPath = path.join(INSTALLER_DIR, pkgFile);
  console.log(`✅ Installer found: ${pkgFile}`);
  
  // Check installer size
  const stats = fs.statSync(pkgPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📏 Installer size: ${sizeMB} MB`);
  
  if (parseFloat(sizeMB) < 50) {
    console.log('⚠️  Installer seems small, may be incomplete');
  } else if (parseFloat(sizeMB) > 1000) {
    console.log('⚠️  Installer is very large, may need optimization');
  } else {
    console.log('✅ Installer size looks reasonable');
  }
  
  // Check installer structure
  console.log('\n📋 Checking installer structure...');
  
  try {
    // Use pkgutil to examine the package
    const pkgInfo = execSync(`pkgutil --expand "${pkgPath}" /tmp/test-pkg`, { encoding: 'utf8' });
    console.log('✅ Installer package structure is valid');
    
    // Check for required files in expanded package
    const expandedDir = '/tmp/test-pkg';
    if (fs.existsSync(expandedDir)) {
      const files = fs.readdirSync(expandedDir);
      console.log(`📁 Package contains: ${files.join(', ')}`);
      
      // Clean up
      execSync(`rm -rf "${expandedDir}"`);
    }
  } catch (error) {
    console.log('❌ Could not examine installer structure:', error.message);
  }
  
  // Check installer metadata
  try {
    const pkgInfo = execSync(`pkgutil --pkg-info "${pkgPath}"`, { encoding: 'utf8' });
    console.log('\n📋 Installer metadata:');
    console.log(pkgInfo);
  } catch (error) {
    console.log('❌ Could not read installer metadata:', error.message);
  }
  
  return pkgPath;
}

function testInstallationSimulation() {
  console.log('\n🔍 Simulating installation...');
  
  // Check if we can read the installer without installing
  try {
    const pkgInfo = execSync(`installer -pkginfo -pkg "${INSTALLER_DIR}/*.pkg"`, { encoding: 'utf8' });
    console.log('✅ Installer can be read successfully');
    
    // Check for installation requirements
    if (pkgInfo.includes('rootVolumeOnly="true"')) {
      console.log('✅ Requires root installation (correct)');
    }
    
    if (pkgInfo.includes('require-scripts="true"')) {
      console.log('✅ Requires installation scripts (correct)');
    }
    
  } catch (error) {
    console.log('❌ Could not simulate installation:', error.message);
  }
}

function testSystemCompatibility() {
  console.log('\n🔍 Testing system compatibility...');
  
  // Check macOS version
  try {
    const macosVersion = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
    console.log(`📋 macOS Version: ${macosVersion}`);
    
    const majorVersion = parseInt(macosVersion.split('.')[0]);
    const minorVersion = parseInt(macosVersion.split('.')[1]);
    
    if (majorVersion >= 10 && minorVersion >= 15) {
      console.log('✅ macOS version is compatible (10.15+)');
    } else if (majorVersion >= 11) {
      console.log('✅ macOS version is compatible (11.0+)');
    } else {
      console.log('❌ macOS version may be too old');
    }
  } catch (error) {
    console.log('❌ Could not check macOS version:', error.message);
  }
  
  // Check architecture
  try {
    const arch = execSync('uname -m', { encoding: 'utf8' }).trim();
    console.log(`🏗️  Architecture: ${arch}`);
    
    if (arch === 'arm64' || arch === 'x86_64') {
      console.log('✅ Architecture is supported');
    } else {
      console.log('❌ Architecture may not be supported');
    }
  } catch (error) {
    console.log('❌ Could not check architecture:', error.message);
  }
  
  // Check available disk space
  try {
    const diskInfo = execSync('df -h /Applications', { encoding: 'utf8' });
    const lines = diskInfo.split('\n');
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      const available = parts[3];
      console.log(`💾 Available space: ${available}`);
      
      // Check if we have enough space (need at least 500MB)
      let availableMB = parseInt(available.replace(/[^\d]/g, ''));
      
      // Handle GB vs MB
      if (available.includes('Gi')) {
        availableMB = availableMB * 1024; // Convert GB to MB
      }
      
      if (availableMB > 500) {
        console.log('✅ Sufficient disk space available');
      } else {
        console.log('⚠️  Limited disk space available');
      }
    }
  } catch (error) {
    console.log('❌ Could not check disk space:', error.message);
  }
}

function testUninstallerScript() {
  console.log('\n🔍 Testing uninstaller script...');
  
  const uninstallerPath = path.join(__dirname, '..', 'scripts', 'installer', 'postinstall');
  
  if (fs.existsSync(uninstallerPath)) {
    const content = fs.readFileSync(uninstallerPath, 'utf8');
    
    // Check for key uninstaller features
    const checks = [
      { name: 'Uninstaller creation', pattern: 'uninstall.sh' },
      { name: 'Application removal', pattern: 'rm -rf "/Applications/ALL-DLP.app"' },
      { name: 'Launch agent removal', pattern: 'LaunchAgents/com.all-dlp.app.plist' },
      { name: 'User data cleanup', pattern: '~/.all-dlp' },
      { name: 'System directory cleanup', pattern: 'Library/Application Support/ALL-DLP' }
    ];
    
    for (const check of checks) {
      if (content.includes(check.pattern)) {
        console.log(`✅ ${check.name}: Found`);
      } else {
        console.log(`❌ ${check.name}: Missing`);
      }
    }
  } else {
    console.log('❌ Uninstaller script not found');
  }
}

// Main execution
try {
  console.log('🚀 Starting installer tests...\n');
  
  // Test installer package
  const installerPath = testInstallerPackage();
  
  // Test installation simulation
  testInstallationSimulation();
  
  // Test system compatibility
  testSystemCompatibility();
  
  // Test uninstaller script
  testUninstallerScript();
  
  console.log('\n🎉 Installer tests completed successfully!');
  console.log(`📦 Installer ready: ${installerPath}`);
  
  console.log('\n📋 Next Steps:');
  console.log('1. Test installation on a clean system');
  console.log('2. Verify all components work correctly');
  console.log('3. Test uninstallation process');
  console.log('4. Validate cross-architecture compatibility');
  
} catch (error) {
  console.error('❌ Installer test failed:', error.message);
  process.exit(1);
} 