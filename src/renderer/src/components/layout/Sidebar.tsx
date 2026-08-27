import React from 'react';
import {
  FolderGit2,
  Folder,
  Star,
  HardDrive,
  LogOut,
  LogIn,
  Plus,
  Github,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFolderStore } from '../../store/folderStore';

export const Sidebar: React.FC = () => {
  const { user, token, logout, setAuthModalOpen } = useAuthStore();
  const { repositories, selectRepository, setNewFolderModalOpen, currentRepo } = useFolderStore();

  const totalStorageKb = repositories.reduce((acc, repo) => acc + (repo.size || 0), 0);
  const totalStorageMb = (totalStorageKb / 1024).toFixed(1);

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between select-none h-full">
      {/* Top Header / Brand with window drag region */}
      <div>
        <div className="titlebar-drag-region h-11 flex items-center px-4 pt-1 border-b border-border/40">
          <div className="titlebar-no-drag flex items-center space-x-2.5 ml-14">
            <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center text-background font-bold shadow-sm shadow-brand-500/30">
              <FolderGit2 className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-text-primary">GitVault</span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => setNewFolderModalOpen(true)}
            disabled={!token}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg text-xs font-semibold shadow transition duration-150"
          >
            <Plus className="w-4 h-4" />
            <span>New Folder</span>
          </button>

          <div className="pt-3">
            <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Storage Views
            </div>

            <button
              onClick={() => selectRepository(null)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                currentRepo === null
                  ? 'bg-surface-subtle text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle/50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Folder className="w-4 h-4 text-accent-blue" />
                <span>All Folders</span>
              </div>
              <span className="text-[11px] text-text-muted bg-surface/80 px-1.5 py-0.5 rounded-full border border-border/60">
                {repositories.length}
              </span>
            </button>

            <button
              onClick={() => selectRepository(null)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle/50 transition"
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-accent-amber" />
                <span>Starred</span>
              </div>
              <span className="text-[11px] text-text-muted">
                {repositories.filter((r) => (r.stargazers_count || 0) > 0).length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom User Card & Storage Meter */}
      <div className="p-3 border-t border-border space-y-3">
        {/* Storage Meter */}
        <div className="bg-surface-subtle/60 rounded-lg p-2.5 border border-border/60">
          <div className="flex items-center justify-between text-[11px] text-text-secondary mb-1">
            <div className="flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-text-muted" />
              <span>GitHub Storage</span>
            </div>
            <span className="font-mono text-text-primary font-medium">{totalStorageMb} MB</span>
          </div>
          <div className="w-full bg-border/80 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min((totalStorageKb / (1024 * 1024)) * 100, 100) || 4}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between items-center text-[10px] text-text-muted">
            <span>Free Tier</span>
            <span>Unlimited repos</span>
          </div>
        </div>

        {/* User profile / Login button */}
        {user ? (
          <div className="flex items-center justify-between bg-surface-subtle/40 rounded-lg p-2 border border-border/40">
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
              className="p-1.5 text-text-muted hover:text-accent-red hover:bg-surface rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-surface-subtle hover:bg-border text-text-primary rounded-lg text-xs font-medium border border-border transition"
          >
            <Github className="w-4 h-4" />
            <span>Connect GitHub</span>
          </button>
        )}
      </div>
    </aside>
  );
};
