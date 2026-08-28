import React from 'react';
import {
  HardDrive,
  Folder,
  Globe,
  Star,
  LogOut,
  Plus,
  Github,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFolderStore } from '../../store/folderStore';

export const Sidebar: React.FC = () => {
  const { user, token, logout, setAuthModalOpen } = useAuthStore();
  const {
    repositories,
    selectRepository,
    setNewFolderModalOpen,
    currentRepo,
    filterMode,
    setFilterMode,
  } = useFolderStore();

  const gitDriveRepos = repositories.filter((r) => r.isGitDrive);
  const starredRepos = repositories.filter((r) => (r.stargazers_count || 0) > 0);

  const totalStorageKb = gitDriveRepos.reduce((acc, repo) => acc + (repo.size || 0), 0);
  const totalStorageMb = (totalStorageKb / 1024).toFixed(1);

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between select-none h-full">
      {/* Top Header / Brand with window drag region */}
      <div>
        <div className="titlebar-drag-region h-11 flex items-center px-4 pt-1 border-b border-border/40">
          <div className="titlebar-no-drag flex items-center space-x-2.5 ml-14">
            <div className="w-6 h-6 rounded-md bg-[#3a3a3c] border border-white/10 flex items-center justify-center text-white font-bold shadow-sm">
              <HardDrive className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-text-primary">GitDrive</span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => setNewFolderModalOpen(true)}
            disabled={!token}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-[#3a3a3c] hover:bg-[#48484a] border border-white/10 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg text-xs font-medium shadow-sm transition duration-150"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Folder</span>
          </button>

          <div className="pt-3">
            <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Storage Views
            </div>

            {/* GitDrive Folders only (Default) */}
            <button
              onClick={() => {
                selectRepository(null);
                setFilterMode('gitdrive');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                currentRepo === null && filterMode === 'gitdrive'
                  ? 'bg-[#3a3a3c] text-white shadow-sm border border-white/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Folder className="w-4 h-4 text-[#54a3ff]" />
                <span>GitDrive Folders</span>
              </div>
              <span className="text-[11px] text-white/80 bg-white/10 px-2 py-0.5 rounded-full border border-white/5 font-medium">
                {gitDriveRepos.length}
              </span>
            </button>

            {/* All GitHub Repositories */}
            <button
              onClick={() => {
                selectRepository(null);
                setFilterMode('all');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                currentRepo === null && filterMode === 'all'
                  ? 'bg-[#3a3a3c] text-white shadow-sm border border-white/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-accent-blue" />
                <span>All Repositories</span>
              </div>
              <span className="text-[11px] text-text-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {repositories.length}
              </span>
            </button>

            {/* Starred */}
            <button
              onClick={() => {
                selectRepository(null);
                setFilterMode('starred');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                currentRepo === null && filterMode === 'starred'
                  ? 'bg-[#3a3a3c] text-white shadow-sm border border-white/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-accent-amber" />
                <span>Starred</span>
              </div>
              <span className="text-[11px] text-text-muted">
                {starredRepos.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom User Card & Storage Meter */}
      <div className="p-3 border-t border-border space-y-3">
        {/* Storage Meter */}
        <div className="bg-[#262626] rounded-xl p-2.5 border border-white/5">
          <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1.5">
            <div className="flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-text-muted" />
              <span>GitHub Storage</span>
            </div>
            <span className="font-mono text-text-primary font-medium">{totalStorageMb} MB</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((totalStorageKb / (1024 * 1024)) * 100, 100) || 4}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between items-center text-[10px] text-text-muted">
            <span>Free Tier</span>
            <span>Unlimited repos</span>
          </div>
        </div>

        {/* User profile / Login button */}
        {user ? (
          <div className="flex items-center justify-between bg-[#262626] rounded-xl p-2 border border-white/5">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-8 h-8 rounded-full border border-border shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-text-primary truncate">
                  {user.name || user.login}
                </div>
                <div className="text-[11px] text-text-muted truncate flex items-center space-x-1">
                  <span>@{user.login}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Disconnect GitHub"
              className="p-1.5 text-text-muted hover:text-accent-red hover:bg-white/5 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-[#3a3a3c] hover:bg-[#48484a] border border-white/10 text-white rounded-lg text-xs font-medium shadow-sm transition"
          >
            <Github className="w-4 h-4" />
            <span>Connect GitHub</span>
          </button>
        )}
      </div>
    </aside>
  );
};
