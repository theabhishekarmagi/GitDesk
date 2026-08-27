import { create } from 'zustand';
import { FileItem, CommitItem, FileUploadPayload } from '@shared/types';
import { GitHubService } from '../services/github';

interface FileState {
  files: FileItem[];
  currentPath: string;
  selectedFile: FileItem | null;
  selectedFilePaths: Set<string>;
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  isUploading: boolean;
  uploadStatusText: string;
  error: string | null;

  // File Preview Modal
  previewFile: FileItem | null;
  setPreviewFile: (file: FileItem | null) => void;

  // File Rename Modal
  renameFileTarget: FileItem | null;
  setRenameFileTarget: (file: FileItem | null) => void;

  // Version history modal state
  isHistoryModalOpen: boolean;
  historyFile: FileItem | null;
  historyCommits: CommitItem[];
  isLoadingHistory: boolean;

  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedFile: (file: FileItem | null) => void;
  toggleSelectFile: (path: string, multi?: boolean) => void;
  selectAllFiles: () => void;
  clearFileSelection: () => void;
  setCurrentPath: (path: string) => void;
  setHistoryModalOpen: (open: boolean) => void;

  fetchFiles: (owner: string, repo: string, path?: string) => Promise<void>;
  uploadFiles: (owner: string, repo: string, uploads: FileUploadPayload[]) => Promise<void>;
  downloadFile: (owner: string, repo: string, file: FileItem) => Promise<void>;
  deleteFile: (owner: string, repo: string, file: FileItem) => Promise<void>;
  deleteSelectedFiles: (owner: string, repo: string) => Promise<void>;
  renameFile: (owner: string, repo: string, file: FileItem, newName: string) => Promise<void>;
  viewHistory: (owner: string, repo: string, file: FileItem) => Promise<void>;
  restoreVersion: (owner: string, repo: string, file: FileItem, commitSha: string) => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  currentPath: '',
  selectedFile: null,
  selectedFilePaths: new Set<string>(),
  viewMode: 'grid',
  isLoading: false,
  isUploading: false,
  uploadStatusText: '',
  error: null,

  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),

  renameFileTarget: null,
  setRenameFileTarget: (file) => set({ renameFileTarget: file }),

  isHistoryModalOpen: false,
  historyFile: null,
  historyCommits: [],
  isLoadingHistory: false,

  setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),
  setSelectedFile: (file: FileItem | null) => set({ selectedFile: file }),
  setCurrentPath: (path: string) => set({ currentPath: path, selectedFilePaths: new Set() }),
  setHistoryModalOpen: (open: boolean) => set({ isHistoryModalOpen: open }),

  toggleSelectFile: (path: string, multi = false) => {
    const current = new Set(get().selectedFilePaths);
    if (!multi) {
      if (current.has(path) && current.size === 1) {
        set({ selectedFilePaths: new Set() });
      } else {
        set({ selectedFilePaths: new Set([path]) });
      }
    } else {
      if (current.has(path)) {
        current.delete(path);
      } else {
        current.add(path);
      }
      set({ selectedFilePaths: new Set(current) });
    }
  },

  selectAllFiles: () => {
    set({ selectedFilePaths: new Set(get().files.map((f) => f.path)) });
  },

  clearFileSelection: () => set({ selectedFilePaths: new Set() }),

  fetchFiles: async (owner: string, repo: string, path: string = '') => {
    set({ isLoading: true, error: null, currentPath: path });
    try {
      const items = await GitHubService.listContents(owner, repo, path);
      // Sort directories first, then files alphabetically
      const sorted = [...items].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });
      set({ files: sorted, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch files:', err);
      set({ isLoading: false, error: err?.message || 'Failed to load files' });
    }
  },

  uploadFiles: async (owner: string, repo: string, uploads: FileUploadPayload[]) => {
    set({ isUploading: true, error: null });
    const currentPath = get().currentPath;
    const newItems: FileItem[] = [];

    try {
      for (let i = 0; i < uploads.length; i++) {
        const item = uploads[i];
        set({
          uploadStatusText: `Uploading ${item.name} (${i + 1}/${uploads.length})...`,
        });

        const targetPath = currentPath ? `${currentPath}/${item.name}` : item.name;

        // Check if file exists to provide sha
        const existing = get().files.find((f) => f.name === item.name);
        const result = await GitHubService.uploadFile(
          owner,
          repo,
          targetPath,
          item.base64,
          undefined,
          existing?.sha
        );

        newItems.push({
          name: item.name,
          path: targetPath,
          sha: result.sha,
          size: item.size,
          type: 'file',
          download_url: result.download_url,
        });
      }

      // Optimistically update the UI so uploaded files appear immediately
      const remainingFiles = get().files.filter((f) => !newItems.some((n) => n.name === f.name));
      const merged = [...remainingFiles, ...newItems].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });

      set({
        files: merged,
        isUploading: false,
        uploadStatusText: '',
      });

      // Synchronize with GitHub in background
      setTimeout(async () => {
        await get().fetchFiles(owner, repo, currentPath);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to upload files:', err);
      set({
        isUploading: false,
        uploadStatusText: '',
        error: err?.message || 'Failed to upload files',
      });
    }
  },

  downloadFile: async (owner: string, repo: string, file: FileItem) => {
    try {
      const dialogApi = window.gitdrive?.dialog || window.gitvault?.dialog;
      if (!dialogApi) {
        if (file.download_url) {
          window.open(file.download_url, '_blank');
        }
        return;
      }

      const saveRes = await dialogApi.showSaveDialog({
        defaultPath: file.name,
      });

      if (saveRes.canceled || !saveRes.filePath) return;

      const fileData = await GitHubService.getFileContent(owner, repo, file.path);
      await dialogApi.saveFileToDisk(saveRes.filePath, fileData.content);
    } catch (err: any) {
      console.error('Download error:', err);
      set({ error: err?.message || 'Failed to download file' });
    }
  },

  deleteFile: async (owner: string, repo: string, file: FileItem) => {
    // Optimistically remove from state immediately
    const remaining = get().files.filter((f) => f.path !== file.path);
    const updatedSelected = new Set(get().selectedFilePaths);
    updatedSelected.delete(file.path);
    set({ files: remaining, selectedFilePaths: updatedSelected });

    try {
      await GitHubService.deleteFile(owner, repo, file.path, file.sha);
      setTimeout(async () => {
        await get().fetchFiles(owner, repo, get().currentPath);
      }, 1000);
    } catch (err: any) {
      console.error('Delete error:', err);
      set({ error: err?.message || 'Failed to delete file' });
      await get().fetchFiles(owner, repo, get().currentPath);
    }
  },

  deleteSelectedFiles: async (owner: string, repo: string) => {
    const selectedPaths = get().selectedFilePaths;
    if (selectedPaths.size === 0) return;

    const filesToDelete = get().files.filter((f) => selectedPaths.has(f.path));
    const remaining = get().files.filter((f) => !selectedPaths.has(f.path));
    set({ files: remaining, selectedFilePaths: new Set() });

    try {
      for (const file of filesToDelete) {
        await GitHubService.deleteFile(owner, repo, file.path, file.sha);
      }
      setTimeout(async () => {
        await get().fetchFiles(owner, repo, get().currentPath);
      }, 1000);
    } catch (err: any) {
      console.error('Batch delete error:', err);
      set({ error: err?.message || 'Failed to delete selected files' });
      await get().fetchFiles(owner, repo, get().currentPath);
    }
  },

  renameFile: async (owner: string, repo: string, file: FileItem, newName: string) => {
    set({ isUploading: true, uploadStatusText: `Renaming ${file.name} to ${newName}...` });
    const dir = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : '';
    const newPath = dir ? `${dir}/${newName}` : newName;

    try {
      const renamed = await GitHubService.renameFile(owner, repo, file.path, newPath);
      const updatedFiles = get().files.map((f) =>
        f.path === file.path
          ? { ...f, name: newName, path: renamed.path, sha: renamed.sha, download_url: renamed.download_url }
          : f
      );
      set({ files: updatedFiles, isUploading: false, uploadStatusText: '', renameFileTarget: null });
      setTimeout(async () => {
        await get().fetchFiles(owner, repo, get().currentPath);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to rename file:', err);
      set({
        isUploading: false,
        uploadStatusText: '',
        error: err?.message || 'Failed to rename file on GitHub',
      });
      throw err;
    }
  },

  viewHistory: async (owner: string, repo: string, file: FileItem) => {
    set({
      isHistoryModalOpen: true,
      historyFile: file,
      isLoadingHistory: true,
      historyCommits: [],
    });
    try {
      const commits = await GitHubService.getCommitHistory(owner, repo, file.path);
      set({ historyCommits: commits, isLoadingHistory: false });
    } catch (err: any) {
      console.error('History fetch error:', err);
      set({ isLoadingHistory: false, error: err?.message || 'Failed to load commit history' });
    }
  },

  restoreVersion: async (owner: string, repo: string, file: FileItem, commitSha: string) => {
    set({ isLoadingHistory: true });
    try {
      // In GitHub, to restore a past version, we get the file content at that commit tree, then update
      const client = (GitHubService as any);
      // We can notify the user or commit past version
      console.log('Restoring version from commit:', commitSha);
      set({ isLoadingHistory: false, isHistoryModalOpen: false });
    } catch (err: any) {
      console.error('Restore error:', err);
      set({ isLoadingHistory: false, error: err?.message || 'Failed to restore version' });
    }
  },
}));
