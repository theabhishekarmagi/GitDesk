import React, { useEffect } from 'react';
import {
  Folder,
  Globe,
  Star,
  Clock,
  HardDrive,
  FolderPlus,
  Github,
  Loader2,
  Edit2,
} from 'lucide-react';
import { useFolderStore } from '../../store/folderStore';
import { useAuthStore } from '../../store/authStore';

export const DashboardView: React.FC = () => {
  const { token, setAuthModalOpen } = useAuthStore();
  const {
    repositories,
    isLoading,
    error,
    searchQuery,
    selectRepository,
    setNewFolderModalOpen,
    fetchRepositories,
    filterMode,
    setFilterMode,
    markAsGitDrive,
    selectedRepoIds,
    toggleSelectRepo,
    clearRepoSelection,
    setRenameModalTarget,
  } = useFolderStore();

  useEffect(() => {
    if (token) {
      fetchRepositories();
    }
  }, [token]);

  const filteredRepos = repositories.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (filterMode === 'gitdrive') {
      return repo.isGitDrive;
    }
    if (filterMode === 'starred') {
      return (repo.stargazers_count || 0) > 0;
    }
    return true;
  });

  const viewTitle =
    filterMode === 'gitdrive'
      ? 'GitDrive Storage Folders'
      : filterMode === 'starred'
      ? 'Starred Folders'
      : 'All GitHub Repositories';

  if (!token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center mb-4 text-text-muted shadow-lg">
          <Github className="w-8 h-8 text-text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Welcome to GitDrive</h2>
        <p className="text-xs text-text-muted max-w-sm mb-6">
          Connect your GitHub account to turn repositories into private, unlimited cloud storage folders.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition"
        >
          <Github className="w-4 h-4" />
          <span>Connect GitHub Account</span>
        </button>
      </div>
    );
  }

  if (isLoading && repositories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-3" />
        <p className="text-xs text-text-muted">Loading your GitDrive folders from GitHub...</p>
      </div>
    );
  }

  if (error && repositories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-xs text-accent-red mb-3">{error}</div>
        <button
          onClick={() => fetchRepositories()}
          className="px-3 py-1.5 bg-surface-subtle hover:bg-border text-xs rounded-md border border-border"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          clearRepoSelection();
        }
      }}
      className="flex-1 overflow-y-auto p-6 select-none"
    >
      {/* Top action row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-text-primary flex items-center space-x-2">
            <span>{viewTitle}</span>
            {filterMode === 'gitdrive' && (
              <span className="text-[10px] bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-full font-medium">
                Drive Only
              </span>
            )}
          </h1>
          <p className="text-xs text-text-muted">
            {filteredRepos.length} {filteredRepos.length === 1 ? 'folder' : 'folders'} available
            {filterMode === 'gitdrive' && repositories.length > filteredRepos.length && (
              <span>
                {' '}•{' '}
                <button
                  onClick={() => setFilterMode('all')}
                  className="text-accent-blue hover:underline"
                >
                  View all {repositories.length} repos
                </button>
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => setNewFolderModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow transition"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Create Folder</span>
        </button>
      </div>

      {filteredRepos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
          <Folder className="w-12 h-12 text-text-muted mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            {searchQuery
              ? 'No folders match your search'
              : filterMode === 'gitdrive'
              ? 'No GitDrive folders found yet'
              : 'No repositories found'}
          </h3>
          <p className="text-xs text-text-muted max-w-xs mb-4">
            {searchQuery
              ? 'Try adjusting your search keywords or clear the filter.'
              : filterMode === 'gitdrive'
              ? 'Create a new folder or switch to "All Repositories" to import existing code repos into GitDrive.'
              : 'Create your first folder to begin uploading files to your GitHub drive.'}
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setNewFolderModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg shadow"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create GitDrive Folder</span>
            </button>
            {filterMode === 'gitdrive' && (
              <button
                onClick={() => setFilterMode('all')}
                className="px-3.5 py-1.5 bg-surface-subtle hover:bg-border text-text-secondary hover:text-text-primary text-xs font-medium rounded-lg border border-border"
              >
                Browse All Repositories
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Native macOS Folder Grid */
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              clearRepoSelection();
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-x-4 gap-y-6 select-none"
        >
          {filteredRepos.map((repo) => {
            const [owner] = repo.full_name.split('/');
            const isSelected = selectedRepoIds.has(repo.id);

            return (
              <div
                key={repo.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelectRepo(repo.id, e.metaKey || e.ctrlKey);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  selectRepository(repo);
                }}
                className={`group relative flex flex-col items-center cursor-pointer transition select-none p-2.5 rounded-xl ${
                  isSelected
                    ? 'bg-accent-blue/15 ring-1 ring-accent-blue/40'
                    : 'hover:bg-surface-subtle/40'
                }`}
              >
                {/* Native Folder SVG Graphic */}
                <div className="w-16 h-14 relative flex items-center justify-center filter drop-shadow-md mb-2 transition group-hover:scale-105">
                  <svg viewBox="0 0 64 52" className="w-16 h-14 text-[#54a3ff] fill-current">
                    <path d="M4 8C4 5.79086 5.79086 4 8 4H22.3431C23.404 4 24.4214 4.42143 25.1716 5.17157L28.8284 8.82843C29.5786 9.57857 30.596 10 31.6569 10H56C58.2091 10 60 11.7909 60 14V44C60 46.2091 58.2091 48 56 48H8C5.79086 48 4 46.2091 4 44V8Z" />
                    <path d="M4 18C4 15.7909 5.79086 14 8 14H56C58.2091 14 60 15.7909 60 18V44C60 46.2091 58.2091 48 56 48H8C5.79086 48 4 46.2091 4 44V18Z" fill="#79c0ff" />
                  </svg>
                </div>

                {/* Centered Folder Name with macOS Selection Pill */}
                <span
                  className={`text-[12px] leading-tight text-center max-w-[110px] break-words line-clamp-2 px-1.5 py-0.5 rounded transition ${
                    isSelected
                      ? 'bg-accent-blue text-white font-medium shadow-sm'
                      : 'text-text-primary group-hover:text-text-primary'
                  }`}
                  title={repo.name}
                >
                  {repo.name}
                </span>

                {/* Hover Quick Actions */}
                <div className="absolute -top-2 right-1 opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 bg-[#161b22]/95 backdrop-blur-md border border-border/80 rounded-lg p-1 shadow-lg transition z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameModalTarget({ type: 'folder', repo });
                    }}
                    title="Rename Folder"
                    className="p-1 text-text-muted hover:text-text-primary rounded transition"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  {!repo.isGitDrive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsGitDrive(owner, repo.name);
                      }}
                      title="Mark as GitDrive folder"
                      className="text-[9px] text-brand-400 bg-brand-500/10 border border-brand-500/30 px-1.5 py-0.5 rounded"
                    >
                      + Drive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
