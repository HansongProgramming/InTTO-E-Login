const { app, BrowserWindow, ipcMain } = require('electron');
const path = require("path");

const startServer = require("./server/app");
const isMac = process.platform === "darwin";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    modal: true,
    // fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadFile(path.join(__dirname, "/pages/sessionpage/sessionPage.html"));
  mainWindow.maximize();
}

function createConfirmWindow(mode = 'register') {
  const confirmWindow = new BrowserWindow({
    width: 600,
    height: 400,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

    confirmWindow.loadURL('http://localhost:3000/confirm');

    confirmWindow.webContents.once('did-finish-load', () => {
      confirmWindow.webContents.send('scanner-mode', mode);
    });

    const channel = (mode === 'register') ? 'barcode-register' : 'barcode-scanned';

    ipcMain.once(channel, (_event, code) => {
      const mainWindow = BrowserWindow.getAllWindows()
        .find((window) => {
          return !window.isDestroyed() && window !== confirmWindow
        });

      
      if (mainWindow) {
        mainWindow.webContents.send('barcode-scanned', code);
      }

      if (!confirmWindow.isDestroyed()) confirmWindow.close();
    })
}


app.whenReady().then(() => {
  app.whenReady().then(() => {
    startServer(() => {
      createWindow();
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

ipcMain.on('open-confirm-window', () => {
  createConfirmWindow();
})