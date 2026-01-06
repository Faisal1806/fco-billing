
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, 'public', 'favicon.ico'),
  });

  // In development, load from the Next.js dev server.
  // In production, load the static HTML file that Next.js exports.
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'out/index.html')}`;

  win.loadURL(startUrl);

  // Optional: Open the DevTools.
  if (isDev) {
    win.webContents.openDevTools();
  }

  // Check for updates after the window is created
  if (!isDev) {
    win.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });
  }
}

app.on('ready', () => {
    createWindow();
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


// Auto-updater event handlers
autoUpdater.on('update-available', () => {
  log.info('Update available.');
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  log.info('Update downloaded; will install on quit');
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (error) => {
  log.error('There was a problem updating the application');
  log.error(error);
  dialog.showErrorBox('Update Error', error == null ? "unknown" : (error.stack || error).toString());
});
