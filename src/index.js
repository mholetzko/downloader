const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let apiServerProcess;
let apiServerReady = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        titleBarStyle: 'hiddenInset',
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startApiServer() {
    console.log('Starting Python API server...');
    
    // Determine if we're in development or production
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    let apiServerPath, pythonPath;
    
    if (isDev) {
        // Development mode - use local files
        const resourcePath = __dirname;
        apiServerPath = path.join(resourcePath, '..', 'api', 'api_server.py');
        pythonPath = path.join(resourcePath, '..', 'venv', 'bin', 'python');
        
        console.log('Development mode - Resource path:', resourcePath);
        console.log('Development mode - API server path:', apiServerPath);
        console.log('Development mode - Python path:', pythonPath);
        
        // Check if API server file exists
        if (!fs.existsSync(apiServerPath)) {
            console.error('API server file not found:', apiServerPath);
            return;
        }
        
        // Check if virtual environment exists
        if (!fs.existsSync(pythonPath)) {
            console.error('Virtual environment not found:', pythonPath);
            return;
        }
    } else {
        // Production mode - use PyInstaller bundle
        const resourcePath = process.resourcesPath;
        apiServerPath = path.join(resourcePath, 'bb-downloader-api', 'bb-downloader-api');
        pythonPath = apiServerPath; // PyInstaller executable is self-contained
        
        console.log('Production mode - Resource path:', resourcePath);
        console.log('Production mode - API server path:', apiServerPath);
        console.log('Production mode - Python path:', pythonPath);
        
        // Check if PyInstaller bundle exists
        if (!fs.existsSync(apiServerPath)) {
            console.error('PyInstaller bundle not found:', apiServerPath);
            return;
        }
    }
    
    // Note: Database is now managed entirely by the API server
    // No need to initialize database in the frontend
    
    // Start API server
    const args = isDev ? [apiServerPath] : [];
    apiServerProcess = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONPATH: isDev ? __dirname : undefined }
    });
    
    apiServerProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('API Server:', output);
        
        // Check if server is ready
        if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
            apiServerReady = true;
            console.log('API server is ready');
        }
    });
    
    apiServerProcess.stderr.on('data', (data) => {
        console.log('API Server Error:', data.toString());
    });
    
    apiServerProcess.on('close', (code) => {
        console.log('API Server exited with code', code);
        apiServerReady = false;
    });
    
    apiServerProcess.on('error', (error) => {
        console.error('Failed to start API server:', error);
        apiServerReady = false;
    });
    
    // Wait a bit for server to start
    setTimeout(() => {
        if (!apiServerReady) {
            console.log('API server startup timeout, but continuing...');
        }
    }, 3000);
}

function stopApiServer() {
    if (apiServerProcess) {
        console.log('Stopping API server...');
        apiServerProcess.kill();
        apiServerProcess = null;
    }
    
    apiServerReady = false;
}

// IPC Handlers
ipcMain.handle('startDownload', async (event, url) => {
    console.log('Starting download for URL:', url);
    
    try {
        // Check if API server is ready
        if (!apiServerReady) {
            console.log('API server not ready, waiting...');
            // Wait up to 10 seconds for API server to be ready
            for (let i = 0; i < 20; i++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                if (apiServerReady) break;
            }
            
            if (!apiServerReady) {
                throw new Error('API server is not responding');
            }
        }
        
        console.log('Making download request to API...');
        const response = await fetch('http://127.0.0.1:8000/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Download started successfully:', result);
        
        // Return the expected format for the frontend
        return {
            success: true,
            downloadId: result.id,
            message: 'Download started successfully'
        };
    } catch (error) {
        console.error('Download error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('get-downloads', async () => {
    try {
        if (!apiServerReady) {
            console.log('API server not ready for get-downloads');
            return [];
        }
        
        const response = await fetch('http://127.0.0.1:8000/api/downloads');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Get downloads error:', error);
        return [];
    }
});

ipcMain.handle('get-download', async (event, downloadId) => {
    try {
        if (!apiServerReady) {
            console.log('API server not ready for get-download');
            return null;
        }
        
        const response = await fetch(`http://127.0.0.1:8000/api/download/${downloadId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                return null; // Download not found
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Get download error:', error);
        return null;
    }
});

ipcMain.handle('checkApiStatus', async () => {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/health');
        const isHealthy = response.ok;
        apiServerReady = isHealthy;
        return isHealthy;
    } catch (error) {
        apiServerReady = false;
        return false;
    }
});

ipcMain.handle('checkFfmpegStatus', async () => {
    try {
        // Check for bundled FFmpeg first
        const bundledFfmpeg = path.join(__dirname, '..', 'ffmpeg', 'ffmpeg');
        if (fs.existsSync(bundledFfmpeg)) {
            console.log('Bundled FFmpeg found:', bundledFfmpeg);
            return { available: true, path: bundledFfmpeg, type: 'bundled' };
        }
        
        // Check system FFmpeg
        const { exec } = require('child_process');
        return new Promise((resolve) => {
            exec('ffmpeg -version', (error, stdout, stderr) => {
                if (error) {
                    resolve({ available: false, error: error.message });
                } else {
                    resolve({ available: true, path: 'system', type: 'system' });
                }
            });
        });
    } catch (error) {
        return { available: false, error: error.message };
    }
});

ipcMain.handle('checkDownloadsFolder', async () => {
    try {
        const downloadsDir = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'bB-downloader');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        return { exists: true, path: downloadsDir };
    } catch (error) {
        return { exists: false, error: error.message };
    }
});

ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});

ipcMain.handle('open-file-in-system', async (event, filePath) => {
    try {
        // Use shell.openPath to open the file in the system file manager
        await shell.openPath(filePath);
    } catch (error) {
        console.error('Error opening file in system:', error);
        // Fallback: try to open the containing folder
        const path = require('path');
        const folderPath = path.dirname(filePath);
        await shell.openPath(folderPath);
    }
});

ipcMain.handle('redownload-file', async (event, downloadId) => {
    if (!apiServerReady) {
        return { success: false, error: 'API server not ready' };
    }
    
    try {
        console.log('Re-downloading file:', downloadId);
        
        const response = await fetch(`http://127.0.0.1:8000/api/download/${downloadId}/redownload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return { success: true, ...result };
        } else {
            const error = await response.text();
            return { success: false, error: error };
        }
    } catch (error) {
        console.error('Re-download error:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('clear-database', async (event) => {
    if (!apiServerReady) {
        return { success: false, error: 'API server not ready' };
    }
    
    try {
        console.log('Clearing database...');
        
        const response = await fetch('http://127.0.0.1:8000/api/downloads/clear', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return { success: true, ...result };
        } else {
            const error = await response.text();
            return { success: false, error: error };
        }
    } catch (error) {
        console.error('Clear database error:', error);
        return { success: false, error: error.message };
    }
});

// App event handlers
app.whenReady().then(() => {
    createWindow();
    startApiServer();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    stopApiServer();
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    stopApiServer();
});

// Handle app termination
process.on('SIGINT', () => {
    stopApiServer();
    app.quit();
});

process.on('SIGTERM', () => {
    stopApiServer();
    app.quit();
});
