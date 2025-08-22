// main.js — Operaciones CE
// ------------------------------------------------------------
// Crea la ventana, configura auto-update (GitHub + electron-updater)
// y usa electron-log si está disponible; si no, hace fallback a consola.

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ---------- Ajustes básicos ----------
const isDev = !app.isPackaged; // true cuando ejecutas con `npm start`

// Recomendado en Windows para notificaciones e identificador de la app
app.setAppUserModelId('com.tuempresa.operaciones');

// Evita múltiples instancias (especialmente útil con auto-update)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ---------- Logger (con fallback si no tienes electron-log) ----------
let log = console;
try {
  // electron-log v5: entrada correcta para proceso principal
  // (si no está instalado, caerá al catch y usaremos `console`)
  // npm i electron-log@5 --save   (opcional)
  // eslint-disable-next-line import/no-extraneous-dependencies
  log = require('electron-log/main');
  log.transports.file.level = 'info';
} catch (_) {
  // sin electron-log, usa consola
  log.info = (...a) => console.log('[updater]', ...a);
  log.warn = (...a) => console.warn('[updater]', ...a);
  log.error = (...a) => console.error('[updater]', ...a);
}
autoUpdater.logger = log;

// ---------- Ventana principal ----------
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
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
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // (Opcional) Abre DevTools en desarrollo
  if (isDev) {
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// Re-focus si el usuario abre otra instancia
app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(() => {
  createWindow();

  // macOS: reabrir ventana si no hay ninguna
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // ---------- Auto-updates ----------
  // En desarrollo no tiene sentido (no hay feed); solo en app empaquetada
  if (!isDev) {
    iniciarAutoUpdate();
  } else {
    log.info('Auto-update deshabilitado en desarrollo.');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- Auto-update: configuración y eventos ----------
function iniciarAutoUpdate() {
  // Recomendación: que el release en GitHub esté marcado como "Latest" y "Published" (no draft).
  // electron-updater detecta el feed (GitHub) con tu config de electron-builder (publish).

  // Comprueba una vez al inicio
  checkForUpdates();

  // Y vuelve a comprobar cada 4 horas
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  setInterval(checkForUpdates, FOUR_HOURS);

  // Eventos útiles
  autoUpdater.on('checking-for-update', () => log.info('Buscando actualización…'));
  autoUpdater.on('update-available', (info) => log.info('Actualización disponible:', info?.version || 'desconocida'));
  autoUpdater.on('update-not-available', () => log.info('No hay actualización disponible.'));
  autoUpdater.on('error', (err) => log.error('Error en autoUpdater:', err?.stack || err));

  autoUpdater.on('download-progress', (p) => {
    const msg = `Descargando: ${Math.round(p.percent)}% (${Math.round(p.transferred / 1024 / 1024)}MB de ${Math.round(p.total / 1024 / 1024)}MB)`;
    log.info(msg);
    // Si quieres, puedes enviar a renderer con mainWindow.webContents.send('update-progress', p);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    log.info('Update descargada:', info?.version || '');
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Reiniciar ahora', 'Luego'],
      defaultId: 0,
      cancelId: 1,
      title: 'Actualización lista',
      message: 'Hay una actualización disponible.',
      detail: '¿Quieres reiniciar ahora para instalarla?',
    });
    if (response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });
}

function checkForUpdates() {
  try {
    // checkForUpdatesAndNotify: muestra notificación cuando hay update
    autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    log.error('Fallo al buscar actualización:', err?.stack || err);
  }
}
