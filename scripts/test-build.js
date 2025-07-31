const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 ALL-DLP Build Validation\n');

let passed = 0;
let failed = 0;

function test(testName, testFunction) {
  try {
    testFunction();
    console.log(`✅ ${testName}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
    failed++;
  }
}

// Test 1: Check if build artifacts exist
test('Build artifacts exist', () => {
  const requiredPaths = [
    'dist/all-dlp-api/all-dlp-api'
  ];
  
  for (const filePath of requiredPaths) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing: ${filePath}`);
    }
  }
  
  // Check FFmpeg (either bundled or system)
  const ffmpegBundled = 'api/ffmpeg/ffmpeg';
  const ffmpegSystem = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
  
  if (!fs.existsSync(ffmpegBundled) && !ffmpegSystem) {
    throw new Error('No FFmpeg found (bundled or system)');
  }
});

// Test 2: Check executable permissions
test('Executable permissions', () => {
  const executables = [
    'dist/all-dlp-api/all-dlp-api'
  ];
  
  for (const filePath of executables) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (!(stats.mode & fs.constants.S_IXUSR)) {
        throw new Error(`${filePath} is not executable`);
      }
    }
  }
  
  // Check FFmpeg if bundled
  const ffmpegPath = 'api/ffmpeg/ffmpeg';
  if (fs.existsSync(ffmpegPath)) {
    const stats = fs.statSync(ffmpegPath);
    if (!(stats.mode & fs.constants.S_IXUSR)) {
      throw new Error(`${ffmpegPath} is not executable`);
    }
  }
});



// Test 3: Check FFmpeg compatibility
test('FFmpeg compatibility', () => {
  const ffmpegPath = 'api/ffmpeg/ffmpeg';
  if (fs.existsSync(ffmpegPath)) {
    try {
      const fileInfo = execSync(`file "${ffmpegPath}"`, { encoding: 'utf8' });
      console.log(`   Bundled FFmpeg: ${fileInfo.trim()}`);
    } catch (error) {
      throw new Error(`Could not check bundled FFmpeg: ${error.message}`);
    }
  } else {
    try {
      const systemFfmpeg = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
      const fileInfo = execSync(`file "${systemFfmpeg}"`, { encoding: 'utf8' });
      console.log(`   System FFmpeg: ${fileInfo.trim()}`);
    } catch (error) {
      console.log('   FFmpeg: Using system FFmpeg');
    }
  }
});

// Test 4: Check bundle size
test('Bundle size reasonable', () => {
  const bundlePath = 'dist/all-dlp-api';
  if (fs.existsSync(bundlePath)) {
    // Calculate directory size recursively
    function getDirSize(dirPath) {
      let totalSize = 0;
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += getDirSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    }
    
    const sizeBytes = getDirSize(bundlePath);
    const sizeMB = sizeBytes / (1024 * 1024);
    
    if (sizeMB < 1) {
      throw new Error(`Bundle too small: ${sizeMB.toFixed(2)}MB`);
    }
    
    if (sizeMB > 500) {
      throw new Error(`Bundle too large: ${sizeMB.toFixed(2)}MB`);
    }
    
    console.log(`   Bundle size: ${sizeMB.toFixed(2)}MB`);
  }
});

// Test 5: Check for required files in bundle
test('Required files in bundle', () => {
  const bundlePath = 'dist/all-dlp-api';
  const requiredFiles = [
    'all-dlp-api'
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.join(bundlePath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing in bundle: ${file}`);
    }
  }
  
  // Check for Python framework or lib-dynload (PyInstaller structure)
  const hasPythonFramework = fs.existsSync(path.join(bundlePath, 'Python.framework'));
  const hasLibDynload = fs.existsSync(path.join(bundlePath, 'lib-dynload'));
  const hasInternal = fs.existsSync(path.join(bundlePath, '_internal'));
  
  if (!hasPythonFramework && !hasLibDynload && !hasInternal) {
    console.log('   Bundle structure: Minimal (may be incomplete)');
  } else {
    console.log('   Bundle structure: Complete PyInstaller bundle');
  }
});

// Test 6: Check Electron app (if built)
test('Electron app structure', () => {
  const appPath = 'dist/mac';
  if (fs.existsSync(appPath)) {
    const appBundle = fs.readdirSync(appPath).find(file => file.endsWith('.app'));
    if (!appBundle) {
      throw new Error('No .app bundle found');
    }
    
    const fullAppPath = path.join(appPath, appBundle);
    const contentsPath = path.join(fullAppPath, 'Contents');
    const macosPath = path.join(contentsPath, 'MacOS');
    const resourcesPath = path.join(contentsPath, 'Resources');
    
    if (!fs.existsSync(contentsPath)) {
      throw new Error('App Contents directory missing');
    }
    
    if (!fs.existsSync(macosPath)) {
      throw new Error('App MacOS directory missing');
    }
    
    if (!fs.existsSync(resourcesPath)) {
      throw new Error('App Resources directory missing');
    }
    
    console.log(`   App: ${appBundle}`);
  } else {
    console.log('   Electron app not built (skipping)');
  }
});

// Print summary
console.log('\n📊 Build Validation Summary:');
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(`   Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 Build validation passed!');
  process.exit(0);
} else {
  console.log('\n❌ Build validation failed!');
  process.exit(1);
} 