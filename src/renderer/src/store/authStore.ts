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
      if (window.gitvault?.secureStorage) {
        await window.gitvault.secureStorage.saveToken(token);
      } else {
        localStorage.setItem('gitvault_pat', token);
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
      if (window.gitvault?.secureStorage) {
        await window.gitvault.secureStorage.deleteToken();
      } else {
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
      if (window.gitvault?.secureStorage) {
        savedToken = await window.gitvault.secureStorage.getToken();
      } else {
        savedToken = localStorage.getItem('gitvault_pat');
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
