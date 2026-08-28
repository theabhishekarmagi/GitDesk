export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  size: number; // in KB
  default_branch: string;
  updated_at: string;
  html_url: string;
  stargazers_count?: number;
  topics?: string[];
  isGitDrive?: boolean;
}

export interface FileItem {
  name: string;
  path: string;
  sha: string;
  size: number; // in bytes
  type: 'file' | 'dir';
  download_url: string | null;
}

export interface CommitItem {
  sha: string;
  message: string;
  author_name: string;
  author_avatar?: string;
  author_date: string;
  html_url: string;
}

export interface UserProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  public_repos: number;
  total_private_repos?: number;
}

export interface FileUploadPayload {
  name: string;
  path: string;
  size: number;
  base64: string;
}

export type SyncStatusType = 'idle' | 'syncing' | 'error' | 'offline';

export interface ISyncStatusEvent {
  status: SyncStatusType;
  message?: string;
  lastSynced?: string;
  pendingCount?: number;
  drivePath?: string;
}

export interface ISyncAPI {
  getDrivePath: () => Promise<string>;
  revealInFinder: (repoName?: string, subPath?: string) => Promise<boolean>;
  pinToFinder: () => Promise<boolean>;
  syncNow: (repoFullName?: string) => Promise<boolean>;
  getStatus: () => Promise<ISyncStatusEvent>;
  onStatusChange: (callback: (status: ISyncStatusEvent) => void) => () => void;
}

export interface IElectronAPI {
  secureStorage: {
    saveToken: (token: string) => Promise<boolean>;
    getToken: () => Promise<string | null>;
    deleteToken: () => Promise<boolean>;
  };
  dialog: {
    openFileDialog: () => Promise<{
      canceled: boolean;
      files: FileUploadPayload[];
    }>;
    showSaveDialog: (options: { defaultPath: string }) => Promise<{
      canceled: boolean;
      filePath?: string;
    }>;
    saveFileToDisk: (filePath: string, base64Content: string) => Promise<boolean>;
  };
  system: {
    openExternal: (url: string) => Promise<void>;
  };
  sync: ISyncAPI;
}

declare global {
  interface Window {
    gitdrive?: IElectronAPI;
    gitvault?: IElectronAPI;
  }
}
