import { app, BrowserWindow, ipcMain, safeStorage, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { syncService } from './syncService';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development';
app.setName('GitDrive');

function getAllPossibleTokenPaths(): string[] {
  const home = app.getPath('home');
  const appData = app.getPath('appData');
  const userData = app.getPath('userData');

  return [
    path.join(userData, 'gitdrive.token'),
    path.join(userData, 'gitvault.token'),
    path.join(appData, 'gitdrive', 'gitdrive.token'),
    path.join(appData, 'GitDrive', 'gitdrive.token'),
    path.join(appData, 'Electron', 'gitdrive.token'),
    path.join(appData, 'gitvault', 'gitvault.token'),
    path.join(appData, 'GitVault', 'gitvault.token'),
    path.join(home, '.gitdrive', 'token'),
  ];
}

function getTokenStoragePath(): string {
  const userDataPath = app.getPath('userData');
  const drivePath = path.join(userDataPath, 'gitdrive.token');
  return drivePath;
}

const appIconPath = fs.existsSync(path.join(__dirname, '../../assets/icon.png'))
  ? path.join(__dirname, '../../assets/icon.png')
  : path.join(process.cwd(), 'assets/icon.png');

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 860,
    minHeight: 560,
    title: 'GitDrive',
    icon: appIconPath,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#1c1c1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      plugins: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  syncService.setMainWindow(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    try {
      app.dock.setIcon(appIconPath);
    } catch (err) {
      console.warn('Failed to set dock icon:', err);
    }
  }

  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  syncService.stopWatching();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
function setupIpcHandlers() {
  // 1. Secure Token Storage
  ipcMain.handle('secure-storage:save-token', async (_event, token: string) => {
    try {
      const primaryPath = getTokenStoragePath();
      const parentDir = path.dirname(primaryPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(token);
        await fs.promises.writeFile(primaryPath, encrypted);
      } else {
        const base64 = Buffer.from(token).toString('base64');
        await fs.promises.writeFile(primaryPath, base64, 'utf-8');
      }

      // Also save backup to ~/.gitdrive/token so it survives any app data cache clears
      try {
        const fallbackDir = path.join(app.getPath('home'), '.gitdrive');
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        const b64 = Buffer.from(token).toString('base64');
        await fs.promises.writeFile(path.join(fallbackDir, 'token'), b64, 'utf-8');
      } catch {}

      syncService.setToken(token);
      syncService.startWatching();
      return true;
    } catch (err) {
      console.error('Failed to save secure token:', err);
      return false;
    }
  });

  ipcMain.handle('secure-storage:get-token', async () => {
    const candidatePaths = getAllPossibleTokenPaths();
    for (const tokenPath of candidatePaths) {
      if (fs.existsSync(tokenPath)) {
        try {
          const raw = await fs.promises.readFile(tokenPath);
          let token: string | null = null;
          if (safeStorage.isEncryptionAvailable()) {
            try {
              token = safeStorage.decryptString(raw);
            } catch (decErr) {
              // safeStorage decrypt may fail if Keychain app identity shifted
            }
          }
          if (!token) {
            const text = raw.toString('utf-8');
            if (text.startsWith('ghp_') || text.startsWith('github_pat_')) {
              token = text.trim();
            } else {
              try {
                const b64 = Buffer.from(text, 'base64').toString('utf-8').trim();
                if (b64.startsWith('ghp_') || b64.startsWith('github_pat_')) {
                  token = b64;
                }
              } catch {}
            }
          }
          if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
            // Keep primary location up to date
            const primaryPath = getTokenStoragePath();
            if (tokenPath !== primaryPath) {
              try {
                if (safeStorage.isEncryptionAvailable()) {
                  await fs.promises.writeFile(primaryPath, safeStorage.encryptString(token));
                }
              } catch {}
            }
            syncService.setToken(token);
            syncService.startWatching();
            return token;
          }
        } catch (err) {
          console.error('Failed to read candidate token path:', tokenPath, err);
        }
      }
    }
    return null;
  });

  ipcMain.handle('secure-storage:delete-token', async () => {
    try {
      const candidatePaths = getAllPossibleTokenPaths();
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          try {
            await fs.promises.unlink(p);
          } catch {}
        }
      }
      syncService.setToken(null);
      syncService.stopWatching();
      return true;
    } catch (err) {
      console.error('Failed to delete token:', err);
      return false;
    }
  });

  // 2. Native Dialogs & File Handlers
  ipcMain.handle('dialog:open-files', async () => {
    if (!mainWindow) return { canceled: true, files: [] };

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      title: 'Select files to upload to GitDrive',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, files: [] };
    }

    const files = await Promise.all(
      result.filePaths.map(async (filePath) => {
        const stat = await fs.promises.stat(filePath);
        const name = path.basename(filePath);
        const buffer = await fs.promises.readFile(filePath);
        const base64 = buffer.toString('base64');
        return {
          name,
          path: filePath,
          size: stat.size,
          base64,
        };
      })
    );

    return { canceled: false, files };
  });

  ipcMain.handle('dialog:show-save', async (_event, options: { defaultPath: string }) => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: options.defaultPath,
    });
    return { canceled: result.canceled, filePath: result.filePath };
  });

  ipcMain.handle('dialog:save-file-disk', async (_event, filePath: string, base64Content: string) => {
    try {
      const buffer = Buffer.from(base64Content, 'base64');
      await fs.promises.writeFile(filePath, buffer);
      return true;
    } catch (err) {
      console.error('Failed to save file to disk:', err);
      return false;
    }
  });

  // 3. System External Opener
  ipcMain.handle('system:open-external', async (_event, url: string) => {
    await shell.openExternal(url);
  });

  // 4. Native Finder / File Explorer Sync Integration
  ipcMain.handle('sync:get-drive-path', async () => {
    return syncService.getDrivePath();
  });

  ipcMain.handle('sync:reveal-in-finder', async (_event, repoName?: string, subPath?: string) => {
    return syncService.revealInFinder(repoName, subPath);
  });

  ipcMain.handle('sync:pin-to-finder', async () => {
    return syncService.pinToFinder();
  });

  ipcMain.handle('sync:sync-now', async (_event, repoFullName?: string) => {
    if (repoFullName) {
      const [owner, repo] = repoFullName.split('/');
      return syncService.pullRepoFromGitHub(owner, repo);
    }
    return false;
  });

  ipcMain.handle('sync:get-status', async () => {
    return syncService.getStatus();
  });
}
