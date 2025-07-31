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
  getAudioSettings: () => ipcRenderer.invoke('get-audio-settings'),
  updateAudioSettings: (settings) => ipcRenderer.invoke('update-audio-settings', settings),
 
  clearDatabase: () => ipcRenderer.invoke('clear-database'),
  checkFfmpegStatus: () => ipcRenderer.invoke('checkFfmpegStatus'),
  checkApiStatus: () => ipcRenderer.invoke('checkApiStatus'),
  checkDownloadsFolder: () => ipcRenderer.invoke('checkDownloadsFolder'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openFileInSystem: (filePath) => ipcRenderer.invoke('open-file-in-system', filePath),
  searchPurchaseOptions: (title, artist) => ipcRenderer.invoke('search-purchase-options', title, artist)
});
