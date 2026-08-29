import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';

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

const dragIconPath = fs.existsSync(path.join(__dirname, '../../assets/drag_icon.png'))
  ? path.join(__dirname, '../../assets/drag_icon.png')
  : path.join(process.cwd(), 'assets/drag_icon.png');

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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Local hardware/user-bound AES-256-GCM encryption:
// 100% silent in-process encryption that NEVER triggers OS Keychain password popups!
function getLocalEncryptionKey(): Buffer {
  const seed = `${os.hostname()}-${os.userInfo().username}-${os.homedir()}-gitdrive-secure-v2`;
  return crypto.createHash('sha256').update(seed).digest();
}

function encryptToken(plainText: string): string {
  const key = getLocalEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `v2:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptToken(raw: string): string | null {
  try {
    const text = raw.trim();
    if (text.startsWith('v2:')) {
      const parts = text.split(':');
      if (parts.length === 4) {
        const iv = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');
        const cipherText = parts[3];
        const key = getLocalEncryptionKey();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(cipherText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }
    }
    // Fallback for plain tokens
    if (text.startsWith('ghp_') || text.startsWith('github_pat_')) {
      return text;
    }
    // Fallback for base64 encoded tokens
    const b64 = Buffer.from(text, 'base64').toString('utf-8').trim();
    if (b64.startsWith('ghp_') || b64.startsWith('github_pat_')) {
      return b64;
    }
    return null;
  } catch {
    return null;
  }
}

// IPC Handlers
function setupIpcHandlers() {
  // 1. Secure Token Storage (Silent AES-256-GCM without OS Keychain popups)
  ipcMain.handle('secure-storage:save-token', async (_event, token: string) => {
    try {
      const primaryPath = getTokenStoragePath();
      const parentDir = path.dirname(primaryPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const encrypted = encryptToken(token);
      await fs.promises.writeFile(primaryPath, encrypted, 'utf-8');

      // Also save backup to ~/.gitdrive/token so it survives any app data cache clears
      try {
        const fallbackDir = path.join(app.getPath('home'), '.gitdrive');
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        await fs.promises.writeFile(path.join(fallbackDir, 'token'), encrypted, 'utf-8');
      } catch {}

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
          const raw = await fs.promises.readFile(tokenPath, 'utf-8');
          const token = decryptToken(raw);
          if (token && (token.startsWith('ghp_') || token.startsWith('github_pat_'))) {
            // Keep primary location up to date in modern v2 format
            const primaryPath = getTokenStoragePath();
            if (tokenPath !== primaryPath || !raw.startsWith('v2:')) {
              try {
                await fs.promises.writeFile(primaryPath, encryptToken(token), 'utf-8');
              } catch {}
            }
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

  // 4. Native Drag-Out Support (Drag any file from GitDrive straight to Desktop / Finder / Explorer)
  ipcMain.handle('drag:prepare-file', async (_event, fileName: string, base64Content: string) => {
    try {
      const cacheDir = path.join(app.getPath('temp'), 'gitdrive-drag-cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      const targetPath = path.join(cacheDir, fileName);
      const buffer = Buffer.from(base64Content, 'base64');
      await fs.promises.writeFile(targetPath, buffer);
      return targetPath;
    } catch (err) {
      console.error('Failed to prepare file for drag:', err);
      return null;
    }
  });

  ipcMain.on('drag:start', (event, filePath: string) => {
    if (!filePath || !fs.existsSync(filePath)) return;
    try {
      const iconToUse = fs.existsSync(dragIconPath)
        ? nativeImage.createFromPath(dragIconPath)
        : nativeImage.createFromPath(appIconPath).resize({ width: 36, height: 36 });

      event.sender.startDrag({
        file: filePath,
        icon: iconToUse,
      });
    } catch (err) {
      console.error('Failed to start native drag:', err);
    }
  });
}
