import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from '../shared/types';

const api: IElectronAPI = {
  secureStorage: {
    saveToken: (token: string) => ipcRenderer.invoke('secure-storage:save-token', token),
    getToken: () => ipcRenderer.invoke('secure-storage:get-token'),
    deleteToken: () => ipcRenderer.invoke('secure-storage:delete-token'),
  },
  dialog: {
    openFileDialog: () => ipcRenderer.invoke('dialog:open-files'),
    showSaveDialog: (options: { defaultPath: string }) => ipcRenderer.invoke('dialog:show-save', options),
    saveFileToDisk: (filePath: string, base64Content: string) =>
      ipcRenderer.invoke('dialog:save-file-disk', filePath, base64Content),
  },
  system: {
    openExternal: (url: string) => ipcRenderer.invoke('system:open-external', url),
  },
  drag: {
    prepareFile: (fileName: string, base64Content: string) =>
      ipcRenderer.invoke('drag:prepare-file', fileName, base64Content),
    startDrag: (filePath: string) =>
      ipcRenderer.send('drag:start', filePath),
  },
};

contextBridge.exposeInMainWorld('gitdrive', api);
contextBridge.exposeInMainWorld('gitvault', api);
