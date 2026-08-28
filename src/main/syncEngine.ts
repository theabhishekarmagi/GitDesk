import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app, shell, BrowserWindow } from 'electron';
import { Octokit } from '@octokit/rest';
import { SyncStatus } from '../shared/types';

interface SyncIndexEntry {
  sha: string;
  size: number;
  mtimeMs: number;
}

type SyncIndex = Record<string, SyncIndexEntry>;

export class SyncEngine {
  private syncRoot: string;
  private indexPath: string;
  private index: SyncIndex = {};
  private watcher: fs.FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private isSyncing = false;
  private pendingCount = 0;
  private lastSyncedAt: string = new Date().toISOString();
  private activeRepo: string | null = null;
  private octokit: Octokit | null = null;
  private token: string | null = null;

  constructor() {
    this.syncRoot = path.join(app.getPath('home'), 'GitDrive');
    this.indexPath = path.join(app.getPath('userData'), 'sync-index.json');
  }

  public init(token?: string | null): void {
    // 1. Ensure syncRoot exists
    try {
      if (!fs.existsSync(this.syncRoot)) {
        fs.mkdirSync(this.syncRoot, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create GitDrive sync root:', err);
    }

    // 2. Load sync index
    this.loadIndex();

    // 3. Update token if provided
    if (token) {
      this.setToken(token);
    }

    // 4. Start watcher
    this.startWatcher();
  }

  public setToken(token: string | null): void {
    this.token = token;
    if (token) {
      this.octokit = new Octokit({ auth: token });
    } else {
      this.octokit = null;
    }
  }

  public getSyncRoot(): string {
    return this.syncRoot;
  }

  public getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      syncRoot: this.syncRoot,
      lastSyncedAt: this.lastSyncedAt,
      activeRepo: this.activeRepo,
      pendingCount: this.pendingCount,
    };
  }

  private emitStatus(): void {
    const status = this.getStatus();
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('sync:status-changed', status);
      }
    });
  }

  private loadIndex(): void {
    try {
      if (fs.existsSync(this.indexPath)) {
        const raw = fs.readFileSync(this.indexPath, 'utf-8');
        this.index = JSON.parse(raw);
      } else {
        this.index = {};
      }
    } catch (err) {
      console.warn('Failed to load sync index, creating empty one:', err);
      this.index = {};
    }
  }

  private saveIndex(): void {
    try {
      fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save sync index:', err);
    }
  }

  private computeGitBlobSha(buffer: Buffer): string {
    return crypto
      .createHash('sha1')
      .update(`blob ${buffer.length}\0`)
      .update(buffer)
      .digest('hex');
  }

  private isIgnored(relPath: string): boolean {
    const parts = relPath.split(/[/\\]/);
    for (const part of parts) {
      if (
        part.startsWith('.') ||
        part.startsWith('~$') ||
        part === 'node_modules' ||
        part === 'Thumbs.db' ||
        part === 'desktop.ini'
      ) {
        return true;
      }
    }
    return false;
  }

  private startWatcher(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    try {
      this.watcher = fs.watch(this.syncRoot, { recursive: true }, (_eventType, filename) => {
        if (!filename) return;
        const normalized = filename.replace(/\\/g, '/');
        if (this.isIgnored(normalized)) return;

        // Debounce file changes
        const existingTimer = this.debounceTimers.get(normalized);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          this.debounceTimers.delete(normalized);
          this.handleLocalFileChange(normalized);
        }, 1200);

        this.debounceTimers.set(normalized, timer);
      });
    } catch (err) {
      console.error('Failed to start fs.watch for GitDrive:', err);
    }
  }

  private async handleLocalFileChange(relPath: string): Promise<void> {
    if (!this.octokit || !this.token) return;

    // relPath format: repoName/subPath/file.ext
    const parts = relPath.split('/');
    if (parts.length < 2) {
      // It's a top-level directory (the repo folder itself)
      return;
    }

    const repoName = parts[0];
    const filePathInRepo = parts.slice(1).join('/');
    const fullPath = path.join(this.syncRoot, relPath);

    try {
      this.isSyncing = true;
      this.pendingCount++;
      this.emitStatus();

      // Check if file still exists (or was deleted)
      const exists = fs.existsSync(fullPath);
      if (!exists) {
        // File was deleted locally
        const cached = this.index[relPath];
        if (cached) {
          try {
            // Get current user
            const { data: user } = await this.octokit.users.getAuthenticated();
            await this.octokit.repos.deleteFile({
              owner: user.login,
              repo: repoName,
              path: filePathInRepo,
              message: `Delete ${filePathInRepo} via GitDrive Finder Sync`,
              sha: cached.sha,
            });
            delete this.index[relPath];
            this.saveIndex();
          } catch (delErr) {
            console.warn(`Could not delete ${relPath} on GitHub:`, delErr);
          }
        }
        return;
      }

      // Check stat
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        return; // Folders in git are implicit
      }

      const buffer = fs.readFileSync(fullPath);
      const sha = this.computeGitBlobSha(buffer);

      // Check if sha already matches index (prevent infinite loop)
      const cached = this.index[relPath];
      if (cached && cached.sha === sha) {
        return;
      }

      // Commit file to GitHub
      const { data: user } = await this.octokit.users.getAuthenticated();
      let currentSha = cached?.sha;

      if (!currentSha) {
        // Check if file exists on GitHub to get sha
        try {
          const { data: existing } = await this.octokit.repos.getContent({
            owner: user.login,
            repo: repoName,
            path: filePathInRepo,
          });
          if (!Array.isArray(existing) && existing.sha) {
            currentSha = existing.sha;
          }
        } catch {
          // File does not exist remotely yet
        }
      }

      const base64Content = buffer.toString('base64');
      const { data: res } = await this.octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repoName,
        path: filePathInRepo,
        message: `Sync ${filePathInRepo} via GitDrive Finder Sync`,
        content: base64Content,
        sha: currentSha,
      });

      this.index[relPath] = {
        sha: res.content?.sha || sha,
        size: buffer.length,
        mtimeMs: stat.mtimeMs,
      };
      this.saveIndex();

      // Notify renderer to refresh file view
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send('sync:file-synced', { repoName, filePath: filePathInRepo });
        }
      });
    } catch (err) {
      console.error(`Error syncing local file ${relPath} to GitHub:`, err);
    } finally {
      this.pendingCount = Math.max(0, this.pendingCount - 1);
      if (this.pendingCount === 0) {
        this.isSyncing = false;
        this.lastSyncedAt = new Date().toISOString();
      }
      this.emitStatus();
    }
  }

  public async syncRepo(owner: string, repo: string, token: string): Promise<boolean> {
    if (!this.octokit || this.token !== token) {
      this.setToken(token);
    }
    if (!this.octokit) return false;

    this.isSyncing = true;
    this.activeRepo = repo;
    this.emitStatus();

    try {
      const repoDir = path.join(this.syncRoot, repo);
      if (!fs.existsSync(repoDir)) {
        fs.mkdirSync(repoDir, { recursive: true });
      }

      // 1. Get default branch
      const { data: repoData } = await this.octokit.repos.get({ owner, repo });
      const defaultBranch = repoData.default_branch || 'main';

      // 2. Fetch full git tree recursively
      let treeData;
      try {
        const { data: tree } = await this.octokit.git.getTree({
          owner,
          repo,
          tree_sha: defaultBranch,
          recursive: 'true',
        });
        treeData = tree;
      } catch (err: any) {
        if (err.status === 409 || err.message?.includes('empty')) {
          // Empty repo
          this.isSyncing = false;
          this.emitStatus();
          return true;
        }
        throw err;
      }

      if (!treeData.tree || treeData.tree.length === 0) {
        this.isSyncing = false;
        this.emitStatus();
        return true;
      }

      // 3. Process each blob item
      for (const item of treeData.tree) {
        if (item.type !== 'blob' || !item.path || !item.sha) continue;

        const relPath = `${repo}/${item.path}`;
        const localPath = path.join(this.syncRoot, relPath);
        const cached = this.index[relPath];

        // Check if file exists locally and sha matches
        let needDownload = false;
        if (!fs.existsSync(localPath)) {
          needDownload = true;
        } else if (!cached || cached.sha !== item.sha) {
          needDownload = true;
        }

        if (needDownload) {
          try {
            // Fetch blob data
            const { data: blob } = await this.octokit.git.getBlob({
              owner,
              repo,
              file_sha: item.sha,
            });

            const parentDir = path.dirname(localPath);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }

            const buffer = Buffer.from(blob.content, 'base64');
            fs.writeFileSync(localPath, buffer);

            const stat = fs.statSync(localPath);
            this.index[relPath] = {
              sha: item.sha,
              size: buffer.length,
              mtimeMs: stat.mtimeMs,
            };
          } catch (dlErr) {
            console.error(`Failed to download ${item.path} from GitHub:`, dlErr);
          }
        }
      }

      this.saveIndex();
      this.lastSyncedAt = new Date().toISOString();
      return true;
    } catch (err) {
      console.error(`Failed to sync repo ${repo} from GitHub:`, err);
      return false;
    } finally {
      this.isSyncing = false;
      this.activeRepo = null;
      this.emitStatus();
    }
  }

  public openInFinder(repoName?: string, filePath?: string): boolean {
    try {
      if (!fs.existsSync(this.syncRoot)) {
        fs.mkdirSync(this.syncRoot, { recursive: true });
      }

      let targetPath = this.syncRoot;
      if (repoName) {
        targetPath = path.join(this.syncRoot, repoName);
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        if (filePath) {
          const itemPath = path.join(targetPath, filePath);
          if (fs.existsSync(itemPath)) {
            shell.showItemInFolder(itemPath);
            return true;
          }
        }
      }

      shell.openPath(targetPath);
      return true;
    } catch (err) {
      console.error('Failed to open in Finder/Explorer:', err);
      return false;
    }
  }
}

export const syncEngine = new SyncEngine();
