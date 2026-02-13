const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printTicket: (data) => ipcRenderer.invoke('PRINT_TICKET', data)
});