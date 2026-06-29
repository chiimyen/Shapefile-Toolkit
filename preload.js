const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  dialogOpenShp: () => ipcRenderer.invoke('dialog-open-shp'),
  dialogOpenFolder: () => ipcRenderer.invoke('dialog-open-folder'),
  dialogSave: (o) => ipcRenderer.invoke('dialog-save', o),
  readShapefile: (p) => ipcRenderer.invoke('read-shapefile', p),
  convertFormat: (o) => ipcRenderer.invoke('convert-format', o),
  spatialOperation: (o) => ipcRenderer.invoke('spatial-operation', o),
  exportFiles: (o) => ipcRenderer.invoke('export-files', o),
  writeFile: (p, c) => ipcRenderer.invoke('write-file', p, c),
  getFileStats: (p) => ipcRenderer.invoke('get-file-stats', p),
  openInExplorer: (p) => ipcRenderer.invoke('open-in-explorer', p)
});