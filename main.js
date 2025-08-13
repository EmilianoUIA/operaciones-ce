// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater'); // <= auto-actualizaciones

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    title: 'Operaciones CE',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

function setupAutoUpdates() {
  // Solo buscar updates cuando la app está empaquetada (.exe instalado)
  if (!app.isPackaged) return;

  // Ajustes razonables: descarga en background e instala al cerrar la app
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Logs útiles (aparecen en la consola si lanzas desde terminal)
  autoUpdater.on('checking-for-update', () => console.log('[updater] buscando update…'));
  autoUpdater.on('update-available', (info) => console.log('[updater] update disponible:', info.version));
  autoUpdater.on('update-not-available', () => console.log('[updater] no hay update'));
  autoUpdater.on('download-progress', (p) => console.log(`[updater] progreso: ${Math.floor(p.percent)}%`));
  autoUpdater.on('update-downloaded', () => console.log('[updater] update descargada; se instalará al salir.'));
  autoUpdater.on('error', (err) => console.error('[updater] error:', err));

  // Dispara la verificación
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


