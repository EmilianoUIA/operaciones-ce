// preload.js
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exponemos una API segura al renderer (index.html)
 * para manejar las actualizaciones manuales.
 *
 * Eventos/acciones que provee:
 * - updates.check()                    -> dispara la verificación de update
 * - updates.download()                 -> descarga si hay update disponible
 * - updates.quitAndInstall()           -> reinicia e instala tras descarga
 * - updates.onStatus(cb)               -> "checking" | "available" | "not-available" | "downloading" | "downloaded" | "error"
 * - updates.onProgress(cb)             -> {percent, transferred, total}
 * - updates.onError(cb)                -> error serializado
 * - updates.onDownloaded(cb)           -> info de la versión descargada
 */
contextBridge.exposeInMainWorld('updates', {
  // acciones
  check: () => ipcRenderer.invoke('updates:check'),
  download: () => ipcRenderer.invoke('updates:download'),
  quitAndInstall: () => ipcRenderer.invoke('updates:quitAndInstall'),

  // listeners
  onStatus: (cb) => {
    ipcRenderer.removeAllListeners('updates:status');
    ipcRenderer.on('updates:status', (_e, status) => cb(status));
  },
  onProgress: (cb) => {
    ipcRenderer.removeAllListeners('updates:progress');
    ipcRenderer.on('updates:progress', (_e, progress) => cb(progress));
  },
  onDownloaded: (cb) => {
    ipcRenderer.removeAllListeners('updates:downloaded');
    ipcRenderer.on('updates:downloaded', (_e, info) => cb(info));
  },
  onError: (cb) => {
    ipcRenderer.removeAllListeners('updates:error');
    ipcRenderer.on('updates:error', (_e, err) => cb(err));
  }
});


