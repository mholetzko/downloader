const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// For macOS, we'll use a simpler approach - just copy the system FFmpeg if available
async function setupFFmpeg() {
  const platform = process.platform;
  const arch = process.arch;
  
  console.log(`Setting up FFmpeg for ${platform} ${arch}...`);
  console.log(`Architecture: ${arch} (${arch === 'x64' ? 'Intel x86_64' : arch === 'arm64' ? 'Apple Silicon' : 'Unknown'})`);
  
  // Create ffmpeg directory in api folder (where the API server expects it)
  const ffmpegDir = path.join(__dirname, '..', 'api', 'ffmpeg');
  if (!fs.existsSync(ffmpegDir)) {
    fs.mkdirSync(ffmpegDir, { recursive: true });
  }
  
  if (platform === 'darwin') {
    // For macOS, try to copy system FFmpeg if available
    try {
      console.log('Checking for system FFmpeg...');
      const ffmpegPath = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
      
      if (ffmpegPath) {
        console.log(`Found system FFmpeg at: ${ffmpegPath}`);
        
        // Check FFmpeg architecture compatibility
        try {
          const ffmpegArch = execSync(`file "${ffmpegPath}"`, { encoding: 'utf8' });
          console.log(`FFmpeg architecture info: ${ffmpegArch.trim()}`);
          
          // Copy to our ffmpeg directory
          const targetPath = path.join(ffmpegDir, 'ffmpeg');
          execSync(`cp "${ffmpegPath}" "${targetPath}"`);
          fs.chmodSync(targetPath, '755');
          
          console.log(`FFmpeg copied to: ${targetPath}`);
          console.log('FFmpeg setup complete!');
          return;
        } catch (archError) {
          console.log('Could not check FFmpeg architecture, but proceeding...');
        }
      }
    } catch (error) {
      console.log('System FFmpeg not found, will use fallback...');
    }
    
    // Fallback: create a symlink to system FFmpeg or provide instructions
    console.log('Creating FFmpeg symlink...');
    try {
      // Try to create a symlink to system FFmpeg
      const targetPath = path.join(ffmpegDir, 'ffmpeg');
      execSync(`ln -sf "$(which ffmpeg)" "${targetPath}"`);
      console.log('FFmpeg symlink created!');
    } catch (error) {
      console.log('Could not create symlink, creating placeholder...');
      // Create a placeholder file with instructions
      const placeholderPath = path.join(ffmpegDir, 'ffmpeg');
      const instructions = `#!/bin/bash
# FFmpeg placeholder
# Please install FFmpeg using: brew install ffmpeg
# Then restart the application
echo "FFmpeg not found. Please install using: brew install ffmpeg"
exit 1
`;
      fs.writeFileSync(placeholderPath, instructions);
      fs.chmodSync(placeholderPath, '755');
      console.log('FFmpeg placeholder created with installation instructions');
    }
    
  } else if (platform === 'win32') {
    // For Windows, provide instructions
    console.log('Windows detected - please download FFmpeg manually');
    const instructions = `# Windows FFmpeg Setup
# Please download FFmpeg from: https://ffmpeg.org/download.html
# Extract to this directory and rename the ffmpeg.exe file
`;
    fs.writeFileSync(path.join(ffmpegDir, 'README.txt'), instructions);
    
  } else if (platform === 'linux') {
    // For Linux, try to copy system FFmpeg
    try {
      console.log('Checking for system FFmpeg...');
      const ffmpegPath = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
      
      if (ffmpegPath) {
        console.log(`Found system FFmpeg at: ${ffmpegPath}`);
        
        // Copy to our ffmpeg directory
        const targetPath = path.join(ffmpegDir, 'ffmpeg');
        execSync(`cp "${ffmpegPath}" "${targetPath}"`);
        fs.chmodSync(targetPath, '755');
        
        console.log(`FFmpeg copied to: ${targetPath}`);
        console.log('FFmpeg setup complete!');
        return;
      }
    } catch (error) {
      console.log('System FFmpeg not found, creating symlink...');
    }
    
    // Create symlink
    try {
      const targetPath = path.join(ffmpegDir, 'ffmpeg');
      execSync(`ln -sf "$(which ffmpeg)" "${targetPath}"`);
      console.log('FFmpeg symlink created!');
    } catch (error) {
      console.log('Could not create symlink, creating placeholder...');
      const placeholderPath = path.join(ffmpegDir, 'ffmpeg');
      const instructions = `#!/bin/bash
# FFmpeg placeholder
# Please install FFmpeg using: sudo apt install ffmpeg
# Then restart the application
echo "FFmpeg not found. Please install using: sudo apt install ffmpeg"
exit 1
`;
      fs.writeFileSync(placeholderPath, instructions);
      fs.chmodSync(placeholderPath, '755');
      console.log('FFmpeg placeholder created with installation instructions');
    }
  }
  
  console.log('FFmpeg setup complete!');
}

// Run the setup
setupFFmpeg().catch(console.error); 