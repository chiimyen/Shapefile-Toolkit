const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window-close', () => mainWindow?.close());

ipcMain.handle('dialog-open-shp', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: '閫夋嫨 Shapefile 鏂囦欢',
    filters: [{ name: 'Shapefile', extensions: ['shp'] }, { name: 'All Files', extensions: ['*'] }],
    properties: ['openFile', 'multiSelections']
  });
  return r.canceled ? [] : r.filePaths;
});

ipcMain.handle('dialog-open-folder', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: '閫夋嫨鍖呭惈 Shapefile 鐨勬枃浠跺す',
    properties: ['openDirectory']
  });
  return r.canceled ? [] : r.filePaths;
});

ipcMain.handle('dialog-save', async (e, opts) => {
  const r = await dialog.showSaveDialog(mainWindow, opts);
  return r.canceled ? null : r.filePath;
});

ipcMain.handle('read-shapefile', async (e, filePath) => {
  try {
    const svc = require('./lib/shp-service');
    return { success: true, data: await svc.readShapefile(filePath) };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('convert-format', async (e, opts) => {
  try {
    const conv = require('./lib/converter');
    return { success: true, data: await conv.convert(opts) };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('spatial-operation', async (e, opts) => {
  try {
    const sp = require('./lib/spatial');
    return { success: true, data: await sp.performOperation(opts) };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('export-files', async (e, opts) => {
  try {
    const conv = require('./lib/converter');
    return { success: true, data: await conv.exportFiles(opts) };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('write-file', async (e, fp, content) => {
  try {
    if (typeof content === 'string') fs.writeFileSync(fp, content, 'utf-8');
    else fs.writeFileSync(fp, Buffer.from(content));
    return { success: true };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('get-file-stats', async (e, fp) => {
  try {
    const s = fs.statSync(fp);
    return { success: true, data: { size: s.size, modified: s.mtime.toISOString(), created: s.birthtime.toISOString() } };
  } catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('open-in-explorer', async (e, fp) => { shell.showItemInFolder(fp); });
