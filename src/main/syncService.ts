import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { exec } from 'child_process';
import { app, shell, BrowserWindow } from 'electron';
import { Octokit } from '@octokit/rest';
import { ISyncStatusEvent, SyncStatusType } from '../shared/types';

interface FileCacheEntry {
  sha: string;
  size: number;
  mtime: number;
}

interface RepoCache {
  [filePath: string]: FileCacheEntry;
}

interface SyncCache {
  [repoName: string]: RepoCache;
}

export class SyncService {
  private drivePath: string;
  private cachePath: string;
  private cache: SyncCache = {};
  private watcher: fs.FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private ignoredTempPaths: Set<string> = new Set();
  private octokit: Octokit | null = null;
  private activeRepos: Map<string, { owner: string; name: string }> = new Map();
  private status: SyncStatusType = 'idle';
  private lastSynced: string = '';
  private pendingCount: number = 0;
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.drivePath = path.join(os.homedir(), 'GitDrive');
    this.cachePath = path.join(app.getPath('userData'), 'sync-cache.json');
    this.ensureDriveDirectory();
    this.loadCache();
  }

  public setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  public setToken(token: string | null) {
    if (token) {
      this.octokit = new Octokit({ auth: token });
    } else {
      this.octokit = null;
    }
  }

  public registerRepo(owner: string, repoName: string) {
    this.activeRepos.set(repoName, { owner, name: repoName });
    const repoDir = path.join(this.drivePath, repoName);
    if (!fs.existsSync(repoDir)) {
      try {
        fs.mkdirSync(repoDir, { recursive: true });
      } catch (err) {
        console.error(`[SyncService] Failed to create dir for ${repoName}:`, err);
      }
    }
  }

  public getDrivePath(): string {
    return this.drivePath;
  }

  public getStatus(): ISyncStatusEvent {
    return {
      status: this.status,
      lastSynced: this.lastSynced,
      pendingCount: this.pendingCount,
      drivePath: this.drivePath,
    };
  }

  private setStatus(status: SyncStatusType, message?: string) {
    this.status = status;
    if (status === 'idle') {
      this.lastSynced = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const event: ISyncStatusEvent = {
      status: this.status,
      message,
      lastSynced: this.lastSynced,
      pendingCount: this.pendingCount,
      drivePath: this.drivePath,
    };
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('sync:status-changed', event);
    }
  }

  private ensureDriveDirectory() {
    if (!fs.existsSync(this.drivePath)) {
      try {
        fs.mkdirSync(this.drivePath, { recursive: true });
      } catch (err) {
        console.error('[SyncService] Failed to create GitDrive root:', err);
      }
    }
  }

  private loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf-8');
        this.cache = JSON.parse(raw);
      } else {
        this.cache = {};
      }
    } catch {
      this.cache = {};
    }
  }

  private saveCache() {
    try {
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (err) {
      console.error('[SyncService] Failed to save sync cache:', err);
    }
  }

  public async revealInFinder(repoName?: string, subPath?: string): Promise<boolean> {
    try {
      this.ensureDriveDirectory();
      let targetPath = this.drivePath;
      if (repoName) {
        targetPath = path.join(this.drivePath, repoName);
        if (subPath) {
          targetPath = path.join(targetPath, subPath);
        }
      }
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      await shell.openPath(targetPath);
      return true;
    } catch (err) {
      console.error('[SyncService] Failed to reveal in Finder:', err);
      return false;
    }
  }

  public async pinToFinder(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return false;
    }
    try {
      this.ensureDriveDirectory();
      // Use macOS sfltool to add to Finder Sidebar Favorites
      const cmd = `sfltool add-item -n "GitDrive" com.apple.LSSharedFileList.FavoriteItems "file://${this.drivePath}"`;
      return new Promise<boolean>((resolve) => {
        exec(cmd, (err) => {
          if (err) {
            // Fallback to AppleScript
            const appleScript = `
              tell application "Finder"
                try
                  set driveAlias to POSIX file "${this.drivePath}" as alias
                  make new alias file at desktop to folder driveAlias
                end try
              end tell
            `;
            exec(`osascript -e '${appleScript}'`, () => resolve(true));
          } else {
            resolve(true);
          }
        });
      });
    } catch (err) {
      console.error('[SyncService] pinToFinder error:', err);
      return false;
    }
  }

  public startWatching() {
    if (this.watcher) return;
    this.ensureDriveDirectory();

    try {
      this.watcher = fs.watch(
        this.drivePath,
        { recursive: true },
        (eventType, filename) => {
          if (!filename) return;
          this.handleFileChange(filename);
        }
      );
      console.log('[SyncService] Started watching', this.drivePath);
    } catch (err) {
      console.error('[SyncService] Watcher start failed:', err);
    }
  }

  public stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  private isIgnored(filename: string): boolean {
    const parts = filename.split(path.sep);
    return parts.some((p) => {
      if (p.startsWith('.')) return true; // .DS_Store, .git, .gitignore
      if (p.startsWith('~$')) return true; // MS Office temp locks
      if (p.endsWith('.tmp') || p.endsWith('.crdownload')) return true;
      if (p === 'Thumbs.db' || p === 'desktop.ini') return true;
      return false;
    });
  }

  private computeGitSha(buffer: Buffer): string {
    const header = `blob ${buffer.length}\0`;
    return crypto.createHash('sha1').update(header).update(buffer).digest('hex');
  }

  private handleFileChange(relativeFilePath: string) {
    if (this.isIgnored(relativeFilePath)) return;

    // Expected format: <repoName>/<fileRelPath>
    const parts = relativeFilePath.split(path.sep);
    if (parts.length < 2) return; // Ignore root items

    const repoName = parts[0];
    const fileRelPath = parts.slice(1).join('/');
    const absolutePath = path.join(this.drivePath, relativeFilePath);

    // Skip if marked as temporary downloaded file
    if (this.ignoredTempPaths.has(absolutePath)) {
      this.ignoredTempPaths.delete(absolutePath);
      return;
    }

    // Debounce to allow user file write/copy to complete
    const timerKey = `${repoName}:${fileRelPath}`;
    const existing = this.debounceTimers.get(timerKey);
    if (existing) {
      clearTimeout(existing);
    }

    this.pendingCount++;
    this.setStatus('syncing', `Syncing ${fileRelPath}...`);

    const timer = setTimeout(async () => {
      this.debounceTimers.delete(timerKey);
      this.pendingCount = Math.max(0, this.pendingCount - 1);
      await this.syncLocalFileToGitHub(repoName, fileRelPath, absolutePath);
    }, 1500);

    this.debounceTimers.set(timerKey, timer);
  }

  private async syncLocalFileToGitHub(repoName: string, fileRelPath: string, absolutePath: string) {
    if (!this.octokit) {
      this.setStatus('idle');
      return;
    }
    const repoInfo = this.activeRepos.get(repoName);
    if (!repoInfo) {
      this.setStatus('idle');
      return;
    }

    try {
      if (!fs.existsSync(absolutePath)) {
        // File was deleted locally -> delete on GitHub
        await this.deleteRemoteFile(repoInfo.owner, repoInfo.name, fileRelPath);
      } else {
        const stats = await fs.promises.stat(absolutePath);
        if (stats.isDirectory()) {
          this.setStatus('idle');
          return;
        }

        const buffer = await fs.promises.readFile(absolutePath);
        const localSha = this.computeGitSha(buffer);

        // Check if matching cached remote SHA
        const cached = this.cache[repoName]?.[fileRelPath];
        if (cached && cached.sha === localSha) {
          this.setStatus('idle');
          return;
        }

        // Upload to GitHub
        await this.uploadToGitHub(repoInfo.owner, repoInfo.name, fileRelPath, buffer, localSha, stats.mtimeMs);
      }
    } catch (err: any) {
      console.error(`[SyncService] Error syncing ${fileRelPath}:`, err);
      this.setStatus('error', err?.message || 'Sync failed');
    } finally {
      if (this.pendingCount === 0) {
        this.setStatus('idle');
      }
    }
  }

  private async uploadToGitHub(
    owner: string,
    repo: string,
    filePath: string,
    buffer: Buffer,
    localSha: string,
    mtime: number
  ) {
    if (!this.octokit) return;

    // Check if remote file exists to get remote sha for update
    let remoteSha: string | undefined = undefined;
    try {
      const res = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
      });
      if (!Array.isArray(res.data) && 'sha' in res.data) {
        remoteSha = res.data.sha;
        if (remoteSha === localSha) {
          // Already in sync
          this.updateCache(repo, filePath, localSha, buffer.length, mtime);
          return;
        }
      }
    } catch (err: any) {
      if (err.status !== 404) {
        throw err;
      }
    }

    // Push commit
    const base64Content = buffer.toString('base64');
    const commitMessage = remoteSha
      ? `Update ${path.basename(filePath)} via GitDrive Desktop Sync`
      : `Add ${path.basename(filePath)} via GitDrive Desktop Sync`;

    const putRes = await this.octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: commitMessage,
      content: base64Content,
      sha: remoteSha,
    });

    const newSha = putRes.data.content?.sha || localSha;
    this.updateCache(repo, filePath, newSha, buffer.length, mtime);
    console.log(`[SyncService] Successfully synced ${filePath} to GitHub (${owner}/${repo})`);
  }

  private async deleteRemoteFile(owner: string, repo: string, filePath: string) {
    if (!this.octokit) return;
    try {
      const res = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
      });
      if (!Array.isArray(res.data) && 'sha' in res.data) {
        await this.octokit.rest.repos.deleteFile({
          owner,
          repo,
          path: filePath,
          message: `Delete ${path.basename(filePath)} via GitDrive Desktop Sync`,
          sha: res.data.sha,
        });
        console.log(`[SyncService] Deleted remote file ${filePath} on GitHub`);
      }
    } catch (err: any) {
      if (err.status !== 404) {
        console.error(`[SyncService] Failed to delete remote ${filePath}:`, err);
      }
    }

    if (this.cache[repo] && this.cache[repo][filePath]) {
      delete this.cache[repo][filePath];
      this.saveCache();
    }
  }

  private updateCache(repo: string, filePath: string, sha: string, size: number, mtime: number) {
    if (!this.cache[repo]) {
      this.cache[repo] = {};
    }
    this.cache[repo][filePath] = { sha, size, mtime };
    this.saveCache();
  }

  /**
   * Pull repository files from GitHub down to local ~/GitDrive/<repo>/
   */
  public async pullRepoFromGitHub(owner: string, repo: string): Promise<boolean> {
    if (!this.octokit) return false;
    this.registerRepo(owner, repo);
    this.setStatus('syncing', `Pulling ${repo} from GitHub...`);

    try {
      const repoDir = path.join(this.drivePath, repo);
      if (!fs.existsSync(repoDir)) {
        fs.mkdirSync(repoDir, { recursive: true });
      }

      // Fetch repository tree
      const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo });
      const branch = repoData.default_branch || 'main';

      const { data: treeData } = await this.octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: 'true',
      });

      for (const item of treeData.tree) {
        if (item.type === 'blob' && item.path && item.sha) {
          const localFilePath = path.join(repoDir, item.path);
          const cached = this.cache[repo]?.[item.path];

          // Check if local file exists and matches sha
          let needsDownload = true;
          if (fs.existsSync(localFilePath)) {
            if (cached && cached.sha === item.sha) {
              needsDownload = false;
            } else {
              const localBuf = await fs.promises.readFile(localFilePath);
              if (this.computeGitSha(localBuf) === item.sha) {
                needsDownload = false;
                this.updateCache(repo, item.path, item.sha, item.size || localBuf.length, Date.now());
              }
            }
          }

          if (needsDownload) {
            // Fetch blob content
            const { data: blobData } = await this.octokit.rest.git.getBlob({
              owner,
              repo,
              file_sha: item.sha,
            });

            const contentBuffer = Buffer.from(blobData.content, blobData.encoding as BufferEncoding);
            const parentDir = path.dirname(localFilePath);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }

            // Mark as temporary so our watcher ignores the write
            this.ignoredTempPaths.add(localFilePath);
            await fs.promises.writeFile(localFilePath, contentBuffer);
            this.updateCache(repo, item.path, item.sha, contentBuffer.length, Date.now());
          }
        }
      }

      this.setStatus('idle');
      return true;
    } catch (err: any) {
      console.error(`[SyncService] pullRepoFromGitHub error:`, err);
      this.setStatus('error', err?.message || 'Pull failed');
      return false;
    }
  }
}

export const syncService = new SyncService();
