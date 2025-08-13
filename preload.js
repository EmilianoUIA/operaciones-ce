const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  appVersion: '2.0.0'
});

