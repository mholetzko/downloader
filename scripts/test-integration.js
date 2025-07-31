const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const http = require('http');

console.log('🧪 ALL-DLP Integration Test Suite\n');

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

// Test 1: System Compatibility
runTest('System Compatibility Check', () => {
  const os = require('os');
  const platform = os.platform();
  const arch = os.arch();
  
  console.log(`   Platform: ${platform}`);
  console.log(`   Architecture: ${arch}`);
  console.log(`   Node.js: ${process.version}`);
  
  if (platform !== 'darwin') {
    throw new Error('Tests currently only support macOS');
  }
  
  if (arch !== 'arm64' && arch !== 'x64') {
    throw new Error(`Unsupported architecture: ${arch}`);
  }
});

// Test 2: Dependencies Check
runTest('Dependencies Check', () => {
  // Check Node.js dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`   Node.js dependencies: ${Object.keys(packageJson.dependencies || {}).length}`);
  
  // Check Python requirements
  if (fs.existsSync('api/requirements.txt')) {
    const requirements = fs.readFileSync('api/requirements.txt', 'utf8');
    const packages = requirements.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`   Python packages: ${packages.length}`);
  } else {
    throw new Error('Python requirements.txt not found');
  }
});

// Test 3: FFmpeg Check
runTest('FFmpeg Availability', () => {
  const ffmpegPath = path.join(__dirname, '..', 'api', 'ffmpeg', 'ffmpeg');
  
  if (fs.existsSync(ffmpegPath)) {
    console.log(`   Bundled FFmpeg: Found at ${ffmpegPath}`);
    
    // Check if it's executable
    const stats = fs.statSync(ffmpegPath);
    if (!(stats.mode & fs.constants.S_IXUSR)) {
      throw new Error('FFmpeg is not executable');
    }
    
    // Check architecture
    try {
      const fileInfo = execSync(`file "${ffmpegPath}"`, { encoding: 'utf8' });
      console.log(`   FFmpeg architecture: ${fileInfo.trim()}`);
    } catch (error) {
      console.log(`   Could not check FFmpeg architecture: ${error.message}`);
    }
  } else {
    // Check system FFmpeg
    try {
      const systemFfmpeg = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
      console.log(`   System FFmpeg: Found at ${systemFfmpeg}`);
    } catch (error) {
      throw new Error('No FFmpeg found (bundled or system)');
    }
  }
});

// Test 4: Python Environment Check
runTest('Python Environment', () => {
  const os = require('os');
  const arch = os.arch();
  const venvPath = arch === 'x64' ? 'venv-x64' : 'venv-arm64';
  const venvBin = path.join(__dirname, '..', venvPath, 'bin');
  
  if (!fs.existsSync(venvBin)) {
    throw new Error(`Virtual environment not found: ${venvPath}`);
  }
  
  console.log(`   Virtual environment: ${venvPath}`);
  
  // Check Python executable
  const pythonPath = path.join(venvBin, 'python');
  if (!fs.existsSync(pythonPath)) {
    throw new Error(`Python not found in ${venvPath}`);
  }
  
  // Check pip
  const pipPath = path.join(venvBin, 'pip');
  if (!fs.existsSync(pipPath)) {
    throw new Error(`pip not found in ${venvPath}`);
  }
  
  console.log(`   Python: ${pythonPath}`);
  console.log(`   pip: ${pipPath}`);
});

// Test 5: API Bundle Check
runTest('API Bundle Check', () => {
  const bundlePath = path.join(__dirname, '..', 'dist', 'all-dlp-api');
  
  if (!fs.existsSync(bundlePath)) {
    console.log('   API bundle not found (run build first)');
    return; // Not a failure, just skip
  }
  
  console.log(`   API bundle: Found at ${bundlePath}`);
  
  // Check main executable
  const executablePath = path.join(bundlePath, 'all-dlp-api');
  if (fs.existsSync(executablePath)) {
    console.log(`   Executable: Found at ${executablePath}`);
    
    // Check if executable
    const stats = fs.statSync(executablePath);
    if (!(stats.mode & fs.constants.S_IXUSR)) {
      throw new Error('API bundle executable is not executable');
    }
    
    // Check architecture
    try {
      const fileInfo = execSync(`file "${executablePath}"`, { encoding: 'utf8' });
      console.log(`   Architecture: ${fileInfo.trim()}`);
    } catch (error) {
      console.log(`   Could not check architecture: ${error.message}`);
    }
  } else {
    throw new Error('API bundle executable not found');
  }
});

// Test 6: API Server Startup Test
runTest('API Server Startup Test', () => {
  return new Promise((resolve, reject) => {
    const os = require('os');
    const arch = os.arch();
    const venvPath = arch === 'x64' ? 'venv-x64' : 'venv-arm64';
    const pythonPath = path.join(__dirname, '..', venvPath, 'bin', 'python');
    const apiServerPath = path.join(__dirname, '..', 'api', 'api_server.py');
    
    if (!fs.existsSync(pythonPath) || !fs.existsSync(apiServerPath)) {
      reject(new Error('Python or API server not found'));
      return;
    }
    
    console.log(`   Starting API server with ${pythonPath}`);
    
    const apiProcess = spawn(pythonPath, [apiServerPath], {
      cwd: path.join(__dirname, '..', 'api'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverReady = false;
    let timeout = setTimeout(() => {
      if (!serverReady) {
        apiProcess.kill();
        reject(new Error('API server startup timeout (30s)'));
      }
    }, 30000);
    
    apiProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
        serverReady = true;
        clearTimeout(timeout);
        
        // Test health endpoint
        const req = http.get('http://localhost:8000/api/health', (res) => {
          if (res.statusCode === 200) {
            console.log('   API server: Started successfully');
            console.log('   Health endpoint: Responding correctly');
            apiProcess.kill();
            resolve();
          } else {
            apiProcess.kill();
            reject(new Error(`Health endpoint returned status ${res.statusCode}`));
          }
        });
        
        req.on('error', (error) => {
          apiProcess.kill();
          reject(new Error(`Health endpoint error: ${error.message}`));
        });
        
        req.setTimeout(5000, () => {
          apiProcess.kill();
          reject(new Error('Health endpoint timeout'));
        });
      }
    });
    
    apiProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
        serverReady = true;
        clearTimeout(timeout);
        
        // Test health endpoint
        const req = http.get('http://localhost:8000/api/health', (res) => {
          if (res.statusCode === 200) {
            console.log('   API server: Started successfully (from stderr)');
            console.log('   Health endpoint: Responding correctly');
            apiProcess.kill();
            resolve();
          } else {
            apiProcess.kill();
            reject(new Error(`Health endpoint returned status ${res.statusCode}`));
          }
        });
        
        req.on('error', (error) => {
          apiProcess.kill();
          reject(new Error(`Health endpoint error: ${error.message}`));
        });
        
        req.setTimeout(5000, () => {
          apiProcess.kill();
          reject(new Error('Health endpoint timeout'));
        });
      }
    });
    
    apiProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`API server spawn error: ${error.message}`));
    });
    
    apiProcess.on('exit', (code) => {
      if (!serverReady) {
        clearTimeout(timeout);
        reject(new Error(`API server exited with code ${code}`));
      }
    });
  });
});

// Test 7: Electron App Structure Check
runTest('Electron App Structure Check', () => {
  const appPath = path.join(__dirname, '..', 'dist', 'mac');
  
  if (!fs.existsSync(appPath)) {
    console.log('   Electron app not found (run build first)');
    return; // Not a failure, just skip
  }
  
  const appBundle = fs.readdirSync(appPath).find(file => file.endsWith('.app'));
  if (!appBundle) {
    throw new Error('No .app bundle found in dist/mac');
  }
  
  const fullAppPath = path.join(appPath, appBundle);
  console.log(`   Electron app: Found at ${fullAppPath}`);
  
  // Check app structure
  const contentsPath = path.join(fullAppPath, 'Contents');
  const macosPath = path.join(contentsPath, 'MacOS');
  const resourcesPath = path.join(contentsPath, 'Resources');
  
  if (!fs.existsSync(contentsPath)) {
    throw new Error('App Contents directory not found');
  }
  
  if (!fs.existsSync(macosPath)) {
    throw new Error('App MacOS directory not found');
  }
  
  if (!fs.existsSync(resourcesPath)) {
    throw new Error('App Resources directory not found');
  }
  
  console.log('   App structure: Valid');
  
  // Check main executable
  const executables = fs.readdirSync(macosPath);
  if (executables.length === 0) {
    throw new Error('No executables found in MacOS directory');
  }
  
  console.log(`   Executables: ${executables.join(', ')}`);
  
  // Check architecture
  try {
    const mainExecutable = path.join(macosPath, executables[0]);
    const fileInfo = execSync(`file "${mainExecutable}"`, { encoding: 'utf8' });
    console.log(`   Architecture: ${fileInfo.trim()}`);
  } catch (error) {
    console.log(`   Could not check architecture: ${error.message}`);
  }
});

// Test 8: Database Check
runTest('Database Check', () => {
  const dbDir = path.join(require('os').homedir(), '.all-dlp');
  const dbPath = path.join(dbDir, 'downloads.db');
  
  if (fs.existsSync(dbPath)) {
    console.log(`   Database: Found at ${dbPath}`);
    
    // Check if it's a valid SQLite database
    try {
      const stats = fs.statSync(dbPath);
      console.log(`   Database size: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        console.log('   Database: Empty (will be initialized on first use)');
      }
    } catch (error) {
      console.log(`   Could not check database: ${error.message}`);
    }
  } else {
    console.log('   Database: Not found (will be created on first use)');
  }
});

// Test 9: Downloads Directory Check
runTest('Downloads Directory Check', () => {
  const downloadsPath = path.join(require('os').homedir(), 'Downloads', 'all-dlp');
  
  if (fs.existsSync(downloadsPath)) {
    console.log(`   Downloads directory: Found at ${downloadsPath}`);
    
    // Check permissions
    try {
      const stats = fs.statSync(downloadsPath);
      if (stats.isDirectory()) {
        console.log('   Downloads directory: Valid directory');
      } else {
        throw new Error('Downloads path is not a directory');
      }
    } catch (error) {
      console.log(`   Could not check downloads directory: ${error.message}`);
    }
  } else {
    console.log('   Downloads directory: Not found (will be created on first use)');
  }
});

// Test 10: Configuration Files Check
runTest('Configuration Files Check', () => {
  const requiredFiles = [
    'package.json',
    'api/requirements.txt',
    'api/api_server.py',
    'src/index.js',
    'src/index.html'
  ];
  
  const missingFiles = [];
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }
  
  console.log(`   Configuration files: All ${requiredFiles.length} files found`);
});

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting integration tests...\n');
  
  // Run synchronous tests
  for (let i = 0; i < 10; i++) {
    // Tests are already running in the loop above
  }
  
  // Run async test separately
  try {
    await runTest('API Server Startup Test', () => {
      return new Promise((resolve, reject) => {
        const os = require('os');
        const arch = os.arch();
        const venvPath = arch === 'x64' ? 'venv-x64' : 'venv-arm64';
        const pythonPath = path.join(__dirname, '..', venvPath, 'bin', 'python');
        const apiServerPath = path.join(__dirname, '..', 'api', 'api_server.py');
        
        if (!fs.existsSync(pythonPath) || !fs.existsSync(apiServerPath)) {
          reject(new Error('Python or API server not found'));
          return;
        }
        
        console.log(`   Starting API server with ${pythonPath}`);
        
        const apiProcess = spawn(pythonPath, [apiServerPath], {
          cwd: path.join(__dirname, '..', 'api'),
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let serverReady = false;
        let timeout = setTimeout(() => {
          if (!serverReady) {
            apiProcess.kill();
            reject(new Error('API server startup timeout (30s)'));
          }
        }, 30000);
        
        apiProcess.stdout.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
            serverReady = true;
            clearTimeout(timeout);
            
            // Test health endpoint
            const req = http.get('http://localhost:8000/api/health', (res) => {
              if (res.statusCode === 200) {
                console.log('   API server: Started successfully');
                console.log('   Health endpoint: Responding correctly');
                apiProcess.kill();
                resolve();
              } else {
                apiProcess.kill();
                reject(new Error(`Health endpoint returned status ${res.statusCode}`));
              }
            });
            
            req.on('error', (error) => {
              apiProcess.kill();
              reject(new Error(`Health endpoint error: ${error.message}`));
            });
            
            req.setTimeout(5000, () => {
              apiProcess.kill();
              reject(new Error('Health endpoint timeout'));
            });
          }
        });
        
        apiProcess.stderr.on('data', (data) => {
          const output = data.toString();
          if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
            serverReady = true;
            clearTimeout(timeout);
            
            // Test health endpoint
            const req = http.get('http://localhost:8000/api/health', (res) => {
              if (res.statusCode === 200) {
                console.log('   API server: Started successfully (from stderr)');
                console.log('   Health endpoint: Responding correctly');
                apiProcess.kill();
                resolve();
              } else {
                apiProcess.kill();
                reject(new Error(`Health endpoint returned status ${res.statusCode}`));
              }
            });
            
            req.on('error', (error) => {
              apiProcess.kill();
              reject(new Error(`Health endpoint error: ${error.message}`));
            });
            
            req.setTimeout(5000, () => {
              apiProcess.kill();
              reject(new Error('Health endpoint timeout'));
            });
          }
        });
        
        apiProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(new Error(`API server spawn error: ${error.message}`));
        });
        
        apiProcess.on('exit', (code) => {
          if (!serverReady) {
            clearTimeout(timeout);
            reject(new Error(`API server exited with code ${code}`));
          }
        });
      });
    });
  } catch (error) {
    console.log(`❌ FAILED: API Server Startup Test`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
  }
  
  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`   Total tests: ${testResults.total}`);
  console.log(`   Passed: ${testResults.passed}`);
  console.log(`   Failed: ${testResults.failed}`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

// Run the tests
runAllTests(); 