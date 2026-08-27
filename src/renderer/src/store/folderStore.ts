import { create } from 'zustand';
import { Repository } from '@shared/types';
import { GitHubService } from '../services/github';

interface FolderState {
  repositories: Repository[];
  currentRepo: Repository | null;
  searchQuery: string;
  filterMode: 'gitdrive' | 'all' | 'starred';
  isLoading: boolean;
  error: string | null;
  isNewFolderModalOpen: boolean;

  setNewFolderModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterMode: (mode: 'gitdrive' | 'all' | 'starred') => void;
  selectRepository: (repo: Repository | null) => void;
  fetchRepositories: () => Promise<void>;
  createFolder: (name: string, description?: string, isPrivate?: boolean) => Promise<Repository>;
  markAsGitDrive: (owner: string, repo: string) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  repositories: [],
  currentRepo: null,
  searchQuery: '',
  filterMode: 'gitdrive',
  isLoading: false,
  error: null,
  isNewFolderModalOpen: false,

  setNewFolderModalOpen: (open: boolean) => set({ isNewFolderModalOpen: open }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setFilterMode: (mode: 'gitdrive' | 'all' | 'starred') => set({ filterMode: mode }),
  selectRepository: (repo: Repository | null) => set({ currentRepo: repo }),

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
}));
