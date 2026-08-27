import React from 'react';
import { History, GitCommit, Clock, ExternalLink, X, RotateCcw } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import { useFolderStore } from '../../store/folderStore';

export const HistoryModal: React.FC = () => {
  const { currentRepo } = useFolderStore();
  const {
    isHistoryModalOpen,
    setHistoryModalOpen,
    historyFile,
    historyCommits,
    isLoadingHistory,
    restoreVersion,
  } = useFileStore();

  if (!isHistoryModalOpen || !historyFile || !currentRepo) return null;

  const [owner, repoName] = currentRepo.full_name.split('/');

  const handleOpenCommit = (url: string) => {
    const sys = window.gitdrive?.system || window.gitvault?.system;
    if (sys) {
      sys.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 text-text-primary flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Version History</h2>
              <p className="text-xs text-text-muted font-mono">{historyFile.name}</p>
            </div>
          </div>
          <button
            onClick={() => setHistoryModalOpen(false)}
            className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Commits List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center py-10 text-xs text-text-muted">
              <Clock className="w-6 h-6 animate-spin mb-2 text-accent-blue" />
              <span>Fetching file version timeline...</span>
            </div>
          ) : historyCommits.length === 0 ? (
            <div className="text-center py-8 text-xs text-text-muted">
              No commit history found for this file.
            </div>
          ) : (
            historyCommits.map((commit, index) => (
              <div
                key={commit.sha}
                className="p-3 bg-surface-subtle/50 hover:bg-surface-subtle border border-border/70 rounded-lg transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    <GitCommit className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-text-primary">
                        {commit.message}
                      </div>
                      <div className="text-[11px] text-text-muted flex items-center space-x-2 mt-1">
                        <span>{commit.author_name}</span>
                        <span>•</span>
                        <span>{new Date(commit.author_date).toLocaleString()}</span>
                        {index === 0 && (
                          <span className="bg-brand-500/20 text-brand-500 text-[10px] px-1.5 py-0.2 rounded font-medium">
                            Current
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleOpenCommit(commit.html_url)}
                      title="Inspect commit on GitHub"
                      className="p-1 text-text-muted hover:text-accent-blue rounded hover:bg-surface transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    {index > 0 && (
                      <button
                        onClick={() => restoreVersion(owner, repoName, historyFile, commit.sha)}
                        title="Restore this version"
                        className="flex items-center space-x-1 px-2 py-1 bg-surface hover:bg-border text-[11px] font-medium text-text-secondary hover:text-text-primary rounded border border-border transition"
                      >
                        <RotateCcw className="w-3 h-3 text-accent-amber" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border flex justify-end">
          <button
            onClick={() => setHistoryModalOpen(false)}
            className="px-4 py-1.5 bg-surface-subtle hover:bg-border text-text-primary text-xs rounded-lg border border-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
