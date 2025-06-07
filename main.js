const { app, BrowserWindow } = require('electron');
const path = require('path');

const isMac = process.platform === 'darwin';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 576,
    });

    mainWindow.loadFile(path.join(__dirname, 'sessionPage.html'));
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

});

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});