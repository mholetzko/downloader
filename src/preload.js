// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  startDownload: (url) => ipcRenderer.invoke('startDownload', url),
  getDownload: (downloadId) => ipcRenderer.invoke('get-download', downloadId),
  getDownloads: () => ipcRenderer.invoke('get-downloads'),
  deleteDownload: (downloadId) => ipcRenderer.invoke('delete-download', downloadId),
  redownloadFile: (downloadId) => ipcRenderer.invoke('redownload-file', downloadId),
  clearDatabase: () => ipcRenderer.invoke('clear-database'),
  checkFfmpegStatus: () => ipcRenderer.invoke('checkFfmpegStatus'),
  checkApiStatus: () => ipcRenderer.invoke('checkApiStatus'),
  checkDownloadsFolder: () => ipcRenderer.invoke('checkDownloadsFolder'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openFileInSystem: (filePath) => ipcRenderer.invoke('open-file-in-system', filePath)
});
