const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require("path");
const fs = require('fs');

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

function createConfirmWindow() {
  const confirmWindow = new BrowserWindow({
    width: 675,
    height: 550,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  confirmWindow.loadURL('http://localhost:3000/confirm');

  const channel = 'barcode-scanned';

  ipcMain.once(channel, (_event, code) => {
    const mainWindow = BrowserWindow.getAllWindows()
      .find((window) => {
        return !window.isDestroyed() && window !== confirmWindow;
      });

    if (mainWindow) {
      mainWindow.webContents.send('barcode-scanned', code);
    }

    if (!confirmWindow.isDestroyed()) confirmWindow.close();
  });
}

function createToggleTimeWindow(internId) {
  const confirmWindow = new BrowserWindow({
    width: 675,
    height: 550,
    modal: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  confirmWindow.loadURL('http://localhost:3000/confirm');

  confirmWindow.webContents.once('did-finish-load', () => {
    confirmWindow.webContents.send('confirm-for', internId);
  });

  ipcMain.once('barcode-scanned', (_event, code) => {
    const mainWindow = BrowserWindow.getAllWindows()
      .find((window) => !window.isDestroyed() && window !== confirmWindow);

    if (mainWindow) {
      mainWindow.webContents.send('toggle-time', code);
    }

    if (!confirmWindow.isDestroyed()) confirmWindow.close();
  });
}



app.whenReady().then(() => {
  startServer(() => {
    createWindow();
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

ipcMain.on("open-time-window", (_event, internId) => {
  createToggleTimeWindow(internId);
});

ipcMain.on("save-csv-file", async (event, { content, filename }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Save CSV",
    defaultPath: filename,
    filters: [{ name: "CSV Files", extensions: ["csv"] }]
  });

  if (!canceled && filePath) {
    fs.writeFile(filePath, content, "utf8", (err) => {
      if (err) {
        console.error("Error saving CSV:", err);
      } else {
        console.log("CSV saved to", filePath);
      }
    });
  }
});