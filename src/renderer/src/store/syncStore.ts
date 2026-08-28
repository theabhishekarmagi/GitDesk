import { create } from 'zustand';
import { ISyncStatusEvent, SyncStatusType } from '../../../shared/types';

interface SyncStoreState {
  status: SyncStatusType;
  message?: string;
  lastSynced?: string;
  pendingCount: number;
  drivePath: string;
  isInitialized: boolean;

  initSync: () => Promise<void>;
  revealInFinder: (repoName?: string, subPath?: string) => Promise<boolean>;
  pinToFinder: () => Promise<boolean>;
  syncNow: (repoFullName?: string) => Promise<boolean>;
}

export const useSyncStore = create<SyncStoreState>((set, get) => ({
  status: 'idle',
  message: undefined,
  lastSynced: undefined,
  pendingCount: 0,
  drivePath: '~/GitDrive',
  isInitialized: false,

  initSync: async () => {
    if (get().isInitialized) return;
    const syncApi = window.gitdrive?.sync || window.gitvault?.sync;
    if (!syncApi) return;

    try {
      const [initStatus, path] = await Promise.all([
        syncApi.getStatus(),
        syncApi.getDrivePath(),
      ]);

      set({
        status: initStatus.status,
        message: initStatus.message,
        lastSynced: initStatus.lastSynced,
        pendingCount: initStatus.pendingCount || 0,
        drivePath: path,
        isInitialized: true,
      });

      // Pin to Finder automatically on start
      syncApi.pinToFinder().catch(() => {});

      // Subscribe to real-time status updates from main process
      syncApi.onStatusChange((event: ISyncStatusEvent) => {
        set({
          status: event.status,
          message: event.message,
          lastSynced: event.lastSynced,
          pendingCount: event.pendingCount || 0,
          drivePath: event.drivePath || get().drivePath,
        });
      });
    } catch (err) {
      console.error('[SyncStore] Failed to initialize sync:', err);
    }
  },

  revealInFinder: async (repoName?: string, subPath?: string) => {
    const syncApi = window.gitdrive?.sync || window.gitvault?.sync;
    if (!syncApi) return false;
    return syncApi.revealInFinder(repoName, subPath);
  },

  pinToFinder: async () => {
    const syncApi = window.gitdrive?.sync || window.gitvault?.sync;
    if (!syncApi) return false;
    return syncApi.pinToFinder();
  },

  syncNow: async (repoFullName?: string) => {
    const syncApi = window.gitdrive?.sync || window.gitvault?.sync;
    if (!syncApi) return false;
    return syncApi.syncNow(repoFullName);
  },
}));
