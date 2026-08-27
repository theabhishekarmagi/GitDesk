import { create } from 'zustand';
import { UserProfile } from '@shared/types';
import { GitHubService, initializeOctokit, clearOctokit } from '../services/github';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;

  setAuthModalOpen: (open: boolean) => void;
  loginWithToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkExistingAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  error: null,
  isAuthModalOpen: false,

  setAuthModalOpen: (open: boolean) => set({ isAuthModalOpen: open }),

  loginWithToken: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      initializeOctokit(token);
      const user = await GitHubService.getCurrentUser(token);
      
      // Save securely via Electron native Keychain
      const sec = window.gitdrive?.secureStorage || window.gitvault?.secureStorage;
      if (sec) {
        await sec.saveToken(token);
      } else {
        localStorage.setItem('gitdrive_pat', token);
      }

      set({ token, user, isLoading: false, isAuthModalOpen: false, error: null });
      return true;
    } catch (err: any) {
      console.error('Failed to log in with GitHub token:', err);
      clearOctokit();
      set({
        isLoading: false,
        error: err?.message || 'Invalid GitHub token or authentication failed.',
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const sec = window.gitdrive?.secureStorage || window.gitvault?.secureStorage;
      if (sec) {
        await sec.deleteToken();
      } else {
        localStorage.removeItem('gitdrive_pat');
        localStorage.removeItem('gitvault_pat');
      }
      clearOctokit();
      set({ token: null, user: null, isLoading: false, error: null, isAuthModalOpen: true });
    } catch (err) {
      console.error('Logout error:', err);
      set({ isLoading: false });
    }
  },

  checkExistingAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      let savedToken: string | null = null;
      const sec = window.gitdrive?.secureStorage || window.gitvault?.secureStorage;
      if (sec) {
        savedToken = await sec.getToken();
      } else {
        savedToken = localStorage.getItem('gitdrive_pat') || localStorage.getItem('gitvault_pat');
      }

      if (savedToken) {
        initializeOctokit(savedToken);
        const user = await GitHubService.getCurrentUser(savedToken);
        set({ token: savedToken, user, isLoading: false, error: null });
      } else {
        set({ token: null, user: null, isLoading: false, isAuthModalOpen: true });
      }
    } catch (err) {
      console.warn('Failed to restore session from keychain:', err);
      clearOctokit();
      set({ token: null, user: null, isLoading: false, isAuthModalOpen: true });
    }
  },
}));
