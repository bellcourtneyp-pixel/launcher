const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bootstrapper', {
  // Get default installation path
  getDefaultPath: () => ipcRenderer.invoke('get-default-path'),
  
  // Select custom installation path
  selectInstallPath: () => ipcRenderer.invoke('select-install-path'),
  
  // Start installation
  startInstall: (path) => ipcRenderer.invoke('start-install', path),
  
  // Retry installation
  retry: () => ipcRenderer.invoke('retry'),
  
  // Close window
  close: () => ipcRenderer.send('window-close'),
  
  // Listen for status updates
  onStatusUpdate: (callback) => {
    ipcRenderer.on('status-update', (event, data) => callback(data));
  },
  
  // Listen for initialization
  onInit: (callback) => {
    ipcRenderer.on('init', (event, data) => callback(data));
  }
});
