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
  sync: {
    getDrivePath: () => ipcRenderer.invoke('sync:get-drive-path'),
    revealInFinder: (repoName?: string, subPath?: string) =>
      ipcRenderer.invoke('sync:reveal-in-finder', repoName, subPath),
    pinToFinder: () => ipcRenderer.invoke('sync:pin-to-finder'),
    syncNow: (repoFullName?: string) => ipcRenderer.invoke('sync:sync-now', repoFullName),
    getStatus: () => ipcRenderer.invoke('sync:get-status'),
    onStatusChange: (callback: (status: any) => void) => {
      const handler = (_event: any, status: any) => callback(status);
      ipcRenderer.on('sync:status-changed', handler);
      return () => {
        ipcRenderer.removeListener('sync:status-changed', handler);
      };
    },
  },
};

contextBridge.exposeInMainWorld('gitdrive', api);
contextBridge.exposeInMainWorld('gitvault', api);
