const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 ALL-DLP Compatibility Checker\n');

// Check system information
console.log('📋 System Information:');
const os = require('os');
console.log(`  Platform: ${os.platform()}`);
console.log(`  Architecture: ${os.arch()}`);
console.log(`  CPU: ${os.cpus()[0].model}`);
console.log(`  Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`);
console.log(`  Node.js: ${process.version}`);
console.log(`  Electron: ${require('electron/package.json').version}`);

// Check Python environment
console.log('\n🐍 Python Environment:');
try {
  const pythonVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
  console.log(`  Python: ${pythonVersion}`);
} catch (error) {
  console.log('  Python: Not found');
}

// Check FFmpeg
console.log('\n🎬 FFmpeg Check:');
const ffmpegPath = path.join(__dirname, '..', 'api', 'ffmpeg', 'ffmpeg');
if (fs.existsSync(ffmpegPath)) {
  try {
    const ffmpegInfo = execSync(`file "${ffmpegPath}"`, { encoding: 'utf8' }).trim();
    console.log(`  FFmpeg: Found at ${ffmpegPath}`);
    console.log(`  FFmpeg Info: ${ffmpegInfo}`);
    
    // Test FFmpeg execution
    try {
      const ffmpegVersion = execSync(`"${ffmpegPath}" -version`, { encoding: 'utf8' }).split('\n')[0];
      console.log(`  FFmpeg Version: ${ffmpegVersion}`);
    } catch (error) {
      console.log(`  FFmpeg Execution: Failed - ${error.message}`);
    }
  } catch (error) {
    console.log(`  FFmpeg: Error checking - ${error.message}`);
  }
} else {
  console.log('  FFmpeg: Not found in bundle');
  
  // Check system FFmpeg
  try {
    const systemFfmpeg = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
    console.log(`  System FFmpeg: Found at ${systemFfmpeg}`);
  } catch (error) {
    console.log('  System FFmpeg: Not found');
  }
}

// Check Python API bundle
console.log('\n📦 Python API Bundle:');
const apiBundlePath = path.join(__dirname, '..', 'dist', 'all-dlp-api');
if (fs.existsSync(apiBundlePath)) {
  console.log(`  API Bundle: Found at ${apiBundlePath}`);
  
  // Check bundle architecture
  try {
    const bundleInfo = execSync(`file "${apiBundlePath}/all-dlp-api"`, { encoding: 'utf8' }).trim();
    console.log(`  Bundle Architecture: ${bundleInfo}`);
  } catch (error) {
    console.log(`  Bundle Architecture: Error checking - ${error.message}`);
  }
} else {
  console.log('  API Bundle: Not found (run build first)');
}

// Check virtual environments
console.log('\n🔧 Virtual Environments:');
const venvArm64 = path.join(__dirname, '..', 'venv-arm64');
const venvX64 = path.join(__dirname, '..', 'venv-x64');

if (fs.existsSync(venvArm64)) {
  console.log('  venv-arm64: Found');
} else {
  console.log('  venv-arm64: Not found');
}

if (fs.existsSync(venvX64)) {
  console.log('  venv-x64: Found');
} else {
  console.log('  venv-x64: Not found');
}

// Compatibility recommendations
console.log('\n💡 Compatibility Recommendations:');
if (os.arch() === 'arm64') {
  console.log('  ✅ You are on Apple Silicon (ARM64)');
  console.log('  📝 For best compatibility:');
  console.log('    - Use macOS 11.0 or later');
  console.log('    - Ensure FFmpeg is compatible with your chip');
  console.log('    - Rebuild if you encounter "corrupted" errors');
} else if (os.arch() === 'x64') {
  console.log('  ✅ You are on Intel (x64)');
  console.log('  📝 For best compatibility:');
  console.log('    - Use macOS 10.9 or later');
  console.log('    - Consider using Rosetta 2 if needed');
}

console.log('\n🔧 Troubleshooting:');
console.log('  If you see "corrupted" errors:');
console.log('    1. Delete the app and reinstall');
console.log('    2. Run: npm run build (to rebuild locally)');
console.log('    3. Check Gatekeeper settings in System Preferences');
console.log('    4. Try: xattr -cr /path/to/ALL-DLP.app');

console.log('\n✅ Compatibility check complete!'); 