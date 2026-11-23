const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopShell', {
  platform: process.platform,
  forceRemoteSync: () => ipcRenderer.invoke('force-remote-sync'),
  getUpdateOrigin: () => 'https://404-horror.ai.studio',
});
