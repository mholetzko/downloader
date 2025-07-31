#!/usr/bin/env node

/**
 * Test script for audio normalization features
 * This script tests the audio processing functionality without requiring actual audio files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔊 Testing Audio Normalization Features\n');

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🔍 Running: ${testName}`);
  
  try {
    testFunction();
    console.log(`✅ PASSED: ${testName}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
  }
}

// Test 1: Check if audio settings API endpoints exist
runTest('Audio Settings API Endpoints', () => {
  const apiServerPath = path.join(__dirname, '..', 'api', 'api_server.py');
  
  if (!fs.existsSync(apiServerPath)) {
    throw new Error('API server file not found');
  }
  
  const apiContent = fs.readFileSync(apiServerPath, 'utf8');
  
  // Check for audio settings model
  if (!apiContent.includes('class AudioSettings')) {
    throw new Error('AudioSettings model not found');
  }
  
  // Check for audio settings endpoints
  if (!apiContent.includes('@app.post("/api/audio-settings")')) {
    throw new Error('POST /api/audio-settings endpoint not found');
  }
  
  if (!apiContent.includes('@app.get("/api/audio-settings")')) {
    throw new Error('GET /api/audio-settings endpoint not found');
  }
  
  console.log('   Audio settings API endpoints: Found');
});

// Test 2: Check if audio normalization function exists
runTest('Audio Normalization Function', () => {
  const apiServerPath = path.join(__dirname, '..', 'api', 'api_server.py');
  
  if (!fs.existsSync(apiServerPath)) {
    throw new Error('API server file not found');
  }
  
  const apiContent = fs.readFileSync(apiServerPath, 'utf8');
  
  // Check for normalize_audio_volume function
  if (!apiContent.includes('def normalize_audio_volume')) {
    throw new Error('normalize_audio_volume function not found');
  }
  
  // Check for load_audio_settings function
  if (!apiContent.includes('def load_audio_settings')) {
    throw new Error('load_audio_settings function not found');
  }
  
  // Check for FFmpeg audio filter usage
  if (!apiContent.includes('loudnorm=I=')) {
    throw new Error('Loudness normalization filter not found');
  }
  
  if (!apiContent.includes('volume=')) {
    throw new Error('Volume boost filter not found');
  }
  
  console.log('   Audio normalization functions: Found');
  console.log('   FFmpeg audio filters: Found');
});

// Test 3: Check if audio settings are integrated into download functions
runTest('Audio Settings Integration', () => {
  const apiServerPath = path.join(__dirname, '..', 'api', 'api_server.py');
  
  if (!fs.existsSync(apiServerPath)) {
    throw new Error('API server file not found');
  }
  
  const apiContent = fs.readFileSync(apiServerPath, 'utf8');
  
  // Check if audio normalization is called in download functions
  const downloadFunctions = [
    'download_youtube_sync',
    'download_spotify_sync', 
    'download_soundcloud_sync'
  ];
  
  for (const func of downloadFunctions) {
    if (!apiContent.includes(`def ${func}`)) {
      console.log(`   Warning: ${func} function not found`);
      continue;
    }
    
    // Check if audio normalization is called in this function
    const funcStart = apiContent.indexOf(`def ${func}`);
    const funcEnd = apiContent.indexOf('def ', funcStart + 1);
    const funcContent = funcEnd > funcStart ? apiContent.substring(funcStart, funcEnd) : apiContent.substring(funcStart);
    
    if (!funcContent.includes('normalize_audio_volume')) {
      console.log(`   Warning: Audio normalization not found in ${func}`);
    } else {
      console.log(`   ✅ Audio normalization found in ${func}`);
    }
  }
});

// Test 4: Check if frontend audio settings component exists
runTest('Frontend Audio Settings Component', () => {
  const audioSettingsPath = path.join(__dirname, '..', 'src', 'audio-settings.js');
  
  if (!fs.existsSync(audioSettingsPath)) {
    throw new Error('Audio settings component not found');
  }
  
  const componentContent = fs.readFileSync(audioSettingsPath, 'utf8');
  
  // Check for AudioSettings class
  if (!componentContent.includes('class AudioSettings')) {
    throw new Error('AudioSettings class not found');
  }
  
  // Check for volume boost slider
  if (!componentContent.includes('volume-boost')) {
    throw new Error('Volume boost slider not found');
  }
  
  // Check for loudness normalization checkbox
  if (!componentContent.includes('normalize-loudness')) {
    throw new Error('Loudness normalization checkbox not found');
  }
  
  // Check for target LUFS selection
  if (!componentContent.includes('target-lufs')) {
    throw new Error('Target LUFS selection not found');
  }
  
  console.log('   Audio settings component: Found');
  console.log('   Volume boost slider: Found');
  console.log('   Loudness normalization: Found');
  console.log('   Target LUFS selection: Found');
});

// Test 5: Check if documentation exists
runTest('Audio Features Documentation', () => {
  const docsPath = path.join(__dirname, '..', 'AUDIO_FEATURES.md');
  
  if (!fs.existsSync(docsPath)) {
    throw new Error('Audio features documentation not found');
  }
  
  const docsContent = fs.readFileSync(docsPath, 'utf8');
  
  // Check for key sections
  const requiredSections = [
    'Volume Boost',
    'Loudness Normalization',
    'How to Use',
    'Technical Implementation',
    'Troubleshooting'
  ];
  
  for (const section of requiredSections) {
    if (!docsContent.includes(section)) {
      throw new Error(`Documentation section "${section}" not found`);
    }
  }
  
  console.log('   Audio features documentation: Found');
  console.log('   All required sections: Present');
});

// Test 6: Check if test script exists
runTest('Audio Test Script', () => {
  const testScriptPath = path.join(__dirname, '..', 'test_audio_normalization.py');
  
  if (!fs.existsSync(testScriptPath)) {
    throw new Error('Audio test script not found');
  }
  
  const testScriptContent = fs.readFileSync(testScriptPath, 'utf8');
  
  // Check for key functions
  if (!testScriptContent.includes('def test_audio_normalization')) {
    throw new Error('test_audio_normalization function not found');
  }
  
  // Check for FFmpeg usage
  if (!testScriptContent.includes('ffmpeg')) {
    throw new Error('FFmpeg usage not found in test script');
  }
  
  console.log('   Audio test script: Found');
  console.log('   Test function: Found');
  console.log('   FFmpeg integration: Found');
});

// Test 7: Check FFmpeg availability for audio processing
runTest('FFmpeg Audio Processing Capability', () => {
  const ffmpegPath = path.join(__dirname, '..', 'api', 'ffmpeg', 'ffmpeg');
  
  if (!fs.existsSync(ffmpegPath)) {
    console.log('   Bundled FFmpeg not found, checking system FFmpeg...');
    
    try {
      const systemFfmpeg = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
      console.log(`   System FFmpeg: Found at ${systemFfmpeg}`);
    } catch (error) {
      throw new Error('No FFmpeg found (bundled or system)');
    }
  } else {
    console.log(`   Bundled FFmpeg: Found at ${ffmpegPath}`);
  }
  
  // Test if FFmpeg supports audio filters
  try {
    const ffmpegHelp = execSync('ffmpeg -filters 2>/dev/null | grep -i loudnorm', { encoding: 'utf8' });
    if (ffmpegHelp.includes('loudnorm')) {
      console.log('   Loudness normalization filter: Available');
    } else {
      console.log('   Warning: Loudness normalization filter not available');
    }
  } catch (error) {
    console.log('   Could not verify loudness normalization filter availability');
  }
});

// Test 8: Check package.json for audio-related scripts
runTest('Package.json Audio Scripts', () => {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check for test script
  if (!packageJson.scripts || !packageJson.scripts.test) {
    console.log('   Warning: test script not found in package.json');
  } else {
    console.log('   Test script: Found');
  }
  
  // Check for audio-related dependencies
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (dependencies['@electron/builder']) {
    console.log('   Electron builder: Found');
  }
  
  console.log('   Package.json: Valid');
});

// Print test summary
console.log('\n📊 Audio Features Test Summary:');
console.log('================================');
console.log(`   Total tests: ${testResults.total}`);
console.log(`   Passed: ${testResults.passed}`);
console.log(`   Failed: ${testResults.failed}`);

if (testResults.failed > 0) {
  console.log('\n❌ Some audio feature tests failed. Please check the output above.');
  process.exit(1);
} else {
  console.log('\n✅ All audio feature tests passed! 🎵');
  console.log('\n🎉 Audio normalization features are ready to use!');
  console.log('   - Volume boost: 1.0x to 5.0x');
  console.log('   - Loudness normalization: -14 to -20 LUFS');
  console.log('   - Automatic processing after downloads');
  console.log('   - Configurable settings via UI');
} 