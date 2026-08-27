import { create } from 'zustand';
import { FileItem, CommitItem, FileUploadPayload } from '@shared/types';
import { GitHubService } from '../services/github';

interface FileState {
  files: FileItem[];
  currentPath: string;
  selectedFile: FileItem | null;
  viewMode: 'grid' | 'list';
  isLoading: boolean;
  isUploading: boolean;
  uploadStatusText: string;
  error: string | null;

  // Version history modal state
  isHistoryModalOpen: boolean;
  historyFile: FileItem | null;
  historyCommits: CommitItem[];
  isLoadingHistory: boolean;

  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedFile: (file: FileItem | null) => void;
  setCurrentPath: (path: string) => void;
  setHistoryModalOpen: (open: boolean) => void;

  fetchFiles: (owner: string, repo: string, path?: string) => Promise<void>;
  uploadFiles: (owner: string, repo: string, uploads: FileUploadPayload[]) => Promise<void>;
  downloadFile: (owner: string, repo: string, file: FileItem) => Promise<void>;
  deleteFile: (owner: string, repo: string, file: FileItem) => Promise<void>;
  viewHistory: (owner: string, repo: string, file: FileItem) => Promise<void>;
  restoreVersion: (owner: string, repo: string, file: FileItem, commitSha: string) => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  currentPath: '',
  selectedFile: null,
  viewMode: 'grid',
  isLoading: false,
  isUploading: false,
  uploadStatusText: '',
  error: null,

  isHistoryModalOpen: false,
  historyFile: null,
  historyCommits: [],
  isLoadingHistory: false,

  setViewMode: (mode: 'grid' | 'list') => set({ viewMode: mode }),
  setSelectedFile: (file: FileItem | null) => set({ selectedFile: file }),
  setCurrentPath: (path: string) => set({ currentPath: path }),
  setHistoryModalOpen: (open: boolean) => set({ isHistoryModalOpen: open }),

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
    try {
      for (let i = 0; i < uploads.length; i++) {
        const item = uploads[i];
        set({
          uploadStatusText: `Uploading ${item.name} (${i + 1}/${uploads.length})...`,
        });

        const targetPath = currentPath ? `${currentPath}/${item.name}` : item.name;

        // Check if file exists to provide sha
        const existing = get().files.find((f) => f.name === item.name);
        await GitHubService.uploadFile(
          owner,
          repo,
          targetPath,
          item.base64,
          undefined,
          existing?.sha
        );
      }

      set({ isUploading: false, uploadStatusText: '' });
      await get().fetchFiles(owner, repo, currentPath);
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
      if (!window.gitvault?.dialog) {
        if (file.download_url) {
          window.open(file.download_url, '_blank');
        }
        return;
      }

      const saveRes = await window.gitvault.dialog.showSaveDialog({
        defaultPath: file.name,
      });

      if (saveRes.canceled || !saveRes.filePath) return;

      const fileData = await GitHubService.getFileContent(owner, repo, file.path);
      await window.gitvault.dialog.saveFileToDisk(saveRes.filePath, fileData.content);
    } catch (err: any) {
      console.error('Download error:', err);
      set({ error: err?.message || 'Failed to download file' });
    }
  },

  deleteFile: async (owner: string, repo: string, file: FileItem) => {
    set({ isLoading: true });
    try {
      await GitHubService.deleteFile(owner, repo, file.path, file.sha);
      await get().fetchFiles(owner, repo, get().currentPath);
    } catch (err: any) {
      console.error('Delete error:', err);
      set({ isLoading: false, error: err?.message || 'Failed to delete file' });
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
