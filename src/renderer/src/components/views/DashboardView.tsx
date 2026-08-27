import React, { useEffect } from 'react';
import {
  Folder,
  Lock,
  Globe,
  Star,
  Clock,
  HardDrive,
  FolderPlus,
  Github,
  Loader2,
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
  } = useFolderStore();

  useEffect(() => {
    if (token) {
      fetchRepositories();
    }
  }, [token]);

  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center mb-4 text-text-muted shadow-lg">
          <Github className="w-8 h-8 text-text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Welcome to GitVault</h2>
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
        <p className="text-xs text-text-muted">Loading your cloud folders from GitHub...</p>
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
    <div className="flex-1 overflow-y-auto p-6 select-none">
      {/* Top action row */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base font-bold text-text-primary">Storage Folders</h1>
          <p className="text-xs text-text-muted">
            {filteredRepos.length} {filteredRepos.length === 1 ? 'folder' : 'folders'} available
          </p>
        </div>

        <button
          onClick={() => setNewFolderModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-subtle hover:bg-border text-text-primary text-xs font-medium rounded-lg border border-border transition shadow-sm"
        >
          <FolderPlus className="w-3.5 h-3.5 text-brand-500" />
          <span>Create Folder</span>
        </button>
      </div>

      {filteredRepos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
          <Folder className="w-12 h-12 text-text-muted mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            {searchQuery ? 'No folders match your search' : 'No storage folders yet'}
          </h3>
          <p className="text-xs text-text-muted max-w-xs mb-4">
            {searchQuery
              ? 'Try adjusting your search keywords or clear the filter.'
              : 'Create your first folder to begin uploading files to your GitHub drive.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setNewFolderModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg shadow"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create First Folder</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => selectRepository(repo)}
              className="group bg-surface hover:bg-surface-subtle border border-border hover:border-brand-500/40 rounded-xl p-4 cursor-pointer transition-all duration-150 shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-subtle group-hover:bg-brand-500/10 border border-border group-hover:border-brand-500/30 flex items-center justify-center text-accent-blue group-hover:text-brand-500 transition">
                    <Folder className="w-5 h-5 fill-current/20" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {repo.private ? (
                      <span title="Private Repository" className="p-1 text-text-muted hover:text-text-secondary">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span title="Public Repository" className="p-1 text-text-muted hover:text-accent-blue">
                        <Globe className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {(repo.stargazers_count || 0) > 0 && (
                      <span className="flex items-center text-[10px] text-accent-amber space-x-0.5">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{repo.stargazers_count}</span>
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xs font-bold text-text-primary group-hover:text-brand-400 transition truncate mb-1">
                  {repo.name}
                </h3>
                <p className="text-[11px] text-text-muted line-clamp-2 h-8 leading-4">
                  {repo.description || 'No description provided'}
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-text-muted">
                <div className="flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span>{(repo.size / 1024).toFixed(1)} MB</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
