# ALL-DLP - Frontend Architecture

This directory contains the Electron frontend application that provides the user interface for ALL-DLP.

## 🏗️ Architecture Overview

```
┌─────────────────┐    IPC     ┌─────────────────┐   HTTP     ┌─────────────────┐
│   Main Process  │◄──────────►│ Renderer Process│◄──────────►│  Python API     │
│   (index.js)    │            │ (renderer.js)   │            │ (api_server.py) │
└─────────────────┘            └─────────────────┘            └─────────────────┘
         │                              │                              │
         │                              │                              │
         ▼                              ▼                              ▼
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│  Electron App   │            │   HTML/CSS/JS   │            │  Download Tools │
│  Window & Menu  │            │  User Interface │            │  (yt-dlp, etc.) │
└─────────────────┘            └─────────────────┘            └─────────────────┘
```

## 📁 File Structure

```
src/
├── index.js          # Main process - Electron app lifecycle
├── preload.js        # Preload script - Secure IPC bridge
├── renderer.js       # Renderer process - UI logic & API calls
├── index.html        # User interface - HTML structure
├── style.css         # Styling (currently inline in HTML)
└── assets/
    └── icons/        # App icons and favicons
```

## 🔄 Component Interactions

### 1. **Main Process** (`index.js`)
- **Purpose**: Manages the Electron application lifecycle
- **Responsibilities**:
  - Creates and manages the main window
  - Handles app menu and system tray
  - Manages the Python API server process
  - Handles app quit and cleanup

```javascript
// Creates the main window
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  icon: path.join(__dirname, 'assets', 'icon.png'),
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### 2. **Preload Script** (`preload.js`)
- **Purpose**: Secure bridge between main and renderer processes
- **Responsibilities**:
  - Exposes safe APIs to the renderer process
  - Handles IPC (Inter-Process Communication)
  - Provides system information and file operations

```javascript
// Exposes APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  // ... other APIs
});
```

### 3. **Renderer Process** (`renderer.js`)
- **Purpose**: Handles user interface logic and API communication
- **Responsibilities**:
  - Manages UI state and user interactions
  - Communicates with Python API server
  - Updates download status and history
  - Handles form submissions and error display

```javascript
// API communication with Python backend
async function startDownload(url) {
  try {
    const response = await fetch('http://localhost:8000/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    // Handle response...
  } catch (error) {
    // Handle error...
  }
}
```

### 4. **User Interface** (`index.html`)
- **Purpose**: Provides the visual interface
- **Features**:
  - Modern, responsive design
  - Download form and status display
  - Download history table
  - System status indicators
  - Modal dialogs for help and settings

## 🔌 IPC (Inter-Process Communication)

### Main → Renderer
- **System information** (API status, FFmpeg availability)
- **File operations** (open downloaded files)
- **App lifecycle events** (quit, minimize)

### Renderer → Main
- **File open requests** (open downloaded files)
- **System status requests** (check API server)
- **App control** (quit, restart)

## 🌐 API Communication

### HTTP Endpoints Used
- `GET /api/health` - Check API server status
- `POST /api/download` - Start a download
- `GET /api/downloads` - Get download history
- `GET /api/download/{id}` - Get specific download status
- `DELETE /api/download/{id}` - Delete download
- `POST /api/download/{id}/redownload` - Re-download file
- `DELETE /api/downloads/clear` - Clear all downloads

### API Integration Flow
1. **User submits URL** → `renderer.js` validates input
2. **API call** → `POST /api/download` with URL
3. **Background processing** → Python API starts download
4. **Status polling** → `renderer.js` polls for updates
5. **UI updates** → Download progress and status displayed
6. **Completion** → File link provided to user

## 🚀 Development Workflow

### Starting Development
```bash
# Start the API server
python api/api_server.py

# Start the Electron app
npm start
```

### Building
```bash
# Development build
npm run dist

# Production build with Python bundling
npm run build-mac
```