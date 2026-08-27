import { create } from 'zustand';
import { Repository } from '@shared/types';
import { GitHubService } from '../services/github';

interface FolderState {
  repositories: Repository[];
  currentRepo: Repository | null;
  searchQuery: string;
  filterMode: 'gitdrive' | 'all' | 'starred';
  selectedRepoIds: Set<number>;
  isLoading: boolean;
  error: string | null;
  isNewFolderModalOpen: boolean;
  renameModalTarget: { type: 'folder'; repo: Repository } | null;

  setNewFolderModalOpen: (open: boolean) => void;
  setRenameModalTarget: (target: { type: 'folder'; repo: Repository } | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterMode: (mode: 'gitdrive' | 'all' | 'starred') => void;
  selectRepository: (repo: Repository | null) => void;
  toggleSelectRepo: (id: number, multi?: boolean) => void;
  selectAllRepos: () => void;
  clearRepoSelection: () => void;
  fetchRepositories: () => Promise<void>;
  createFolder: (name: string, description?: string, isPrivate?: boolean) => Promise<Repository>;
  markAsGitDrive: (owner: string, repo: string) => Promise<void>;
  renameFolder: (owner: string, oldName: string, newName: string) => Promise<Repository>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  repositories: [],
  currentRepo: null,
  searchQuery: '',
  filterMode: 'gitdrive',
  selectedRepoIds: new Set<number>(),
  isLoading: false,
  error: null,
  isNewFolderModalOpen: false,
  renameModalTarget: null,

  setNewFolderModalOpen: (open: boolean) => set({ isNewFolderModalOpen: open }),
  setRenameModalTarget: (target) => set({ renameModalTarget: target }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setFilterMode: (mode: 'gitdrive' | 'all' | 'starred') => set({ filterMode: mode, selectedRepoIds: new Set() }),
  selectRepository: (repo: Repository | null) => set({ currentRepo: repo, selectedRepoIds: new Set() }),

  toggleSelectRepo: (id: number, multi = false) => {
    const current = new Set(get().selectedRepoIds);
    if (!multi) {
      if (current.has(id) && current.size === 1) {
        set({ selectedRepoIds: new Set() });
      } else {
        set({ selectedRepoIds: new Set([id]) });
      }
    } else {
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      set({ selectedRepoIds: new Set(current) });
    }
  },

  selectAllRepos: () => {
    const repos = get().repositories;
    const filter = get().filterMode;
    const filtered = repos.filter((r) => (filter === 'gitdrive' ? r.isGitDrive : filter === 'starred' ? (r.stargazers_count || 0) > 0 : true));
    set({ selectedRepoIds: new Set(filtered.map((r) => r.id)) });
  },

  clearRepoSelection: () => set({ selectedRepoIds: new Set() }),

  fetchRepositories: async () => {
    set({ isLoading: true, error: null });
    try {
      const repos = await GitHubService.listRepositories();
      set({ repositories: repos, isLoading: false });
    } catch (err: any) {
      console.error('Failed to load repositories:', err);
      set({
        isLoading: false,
        error: err?.message || 'Failed to load folders from GitHub',
      });
    }
  },

  createFolder: async (name: string, description: string = '', isPrivate: boolean = true) => {
    set({ isLoading: true, error: null });
    try {
      const newRepo = await GitHubService.createRepository(name, description, isPrivate);
      const existing = get().repositories;
      set({
        repositories: [newRepo, ...existing],
        isLoading: false,
        isNewFolderModalOpen: false,
      });
      return newRepo;
    } catch (err: any) {
      console.error('Failed to create folder/repo:', err);
      set({
        isLoading: false,
        error: err?.message || 'Failed to create folder on GitHub',
      });
      throw err;
    }
  },

  markAsGitDrive: async (owner: string, repoName: string) => {
    try {
      await GitHubService.markAsGitDrive(owner, repoName);
      set((state) => ({
        repositories: state.repositories.map((r) =>
          r.name === repoName ? { ...r, isGitDrive: true, topics: [...(r.topics || []), 'gitdrive'] } : r
        ),
      }));
    } catch (err) {
      console.error('Failed to mark as GitDrive folder:', err);
    }
  },

  renameFolder: async (owner: string, oldName: string, newName: string) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRepo = await GitHubService.renameRepository(owner, oldName, newName);
      set((state) => {
        const nextRepos = state.repositories.map((r) => (r.name === oldName ? updatedRepo : r));
        const nextCurrent = state.currentRepo?.name === oldName ? updatedRepo : state.currentRepo;
        return {
          repositories: nextRepos,
          currentRepo: nextCurrent,
          isLoading: false,
          renameModalTarget: null,
        };
      });
      return updatedRepo;
    } catch (err: any) {
      console.error('Failed to rename folder:', err);
      set({
        isLoading: false,
        error: err?.message || 'Failed to rename folder on GitHub',
      });
      throw err;
    }
  },
}));
