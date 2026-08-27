import React from 'react';
import { Download, Trash2, X, CheckSquare, Square } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import { useFolderStore } from '../../store/folderStore';

export const BatchActionBar: React.FC = () => {
  const { currentRepo, selectedRepoIds, clearRepoSelection, selectAllRepos, repositories } = useFolderStore();
  const {
    selectedFilePaths,
    clearFileSelection,
    selectAllFiles,
    deleteSelectedFiles,
    downloadFile,
    files,
  } = useFileStore();

  const isFolderView = currentRepo !== null;
  const selectedCount = isFolderView ? selectedFilePaths.size : selectedRepoIds.size;

  if (selectedCount === 0) return null;

  const totalCount = isFolderView ? files.length : repositories.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  const handleDownloadSelected = async () => {
    if (!currentRepo) return;
    const [owner, repo] = currentRepo.full_name.split('/');
    const selectedFiles = files.filter((f) => selectedFilePaths.has(f.path));
    for (const f of selectedFiles) {
      await downloadFile(owner, repo, f);
    }
  };

  const handleDeleteSelected = async () => {
    if (!currentRepo) return;
    const [owner, repo] = currentRepo.full_name.split('/');
    if (window.confirm(`Are you sure you want to delete ${selectedCount} file${selectedCount > 1 ? 's' : ''}?`)) {
      await deleteSelectedFiles(owner, repo);
    }
  };

  const handleToggleSelectAll = () => {
    if (isFolderView) {
      if (isAllSelected) {
        clearFileSelection();
      } else {
        selectAllFiles();
      }
    } else {
      if (isAllSelected) {
        clearRepoSelection();
      } else {
        selectAllRepos();
      }
    }
  };

  const handleClear = () => {
    if (isFolderView) {
      clearFileSelection();
    } else {
      clearRepoSelection();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200 select-none">
      <div className="bg-[#2c2c2e]/95 backdrop-blur-md border border-white/10 shadow-2xl rounded-full px-4 py-2 flex items-center space-x-3 text-text-primary">
        {/* Count pill */}
        <div className="flex items-center space-x-2 border-r border-border/60 pr-3">
          <button
            onClick={handleToggleSelectAll}
            className="p-1 hover:bg-surface-subtle rounded transition text-brand-400"
            title={isAllSelected ? 'Deselect all' : 'Select all'}
          >
            {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
          <span className="text-xs font-semibold">
            {selectedCount} {isFolderView ? (selectedCount === 1 ? 'file' : 'files') : (selectedCount === 1 ? 'folder' : 'folders')} selected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {isFolderView && (
            <button
              onClick={handleDownloadSelected}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-subtle hover:bg-border text-xs rounded-full border border-border transition text-text-secondary hover:text-text-primary"
              title="Download selected files"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          )}

          {isFolderView && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-accent-red/10 hover:bg-accent-red/20 text-accent-red text-xs rounded-full border border-accent-red/30 transition"
              title="Delete selected files"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={handleClear}
            className="p-1.5 hover:bg-surface-subtle text-text-muted hover:text-text-primary rounded-full transition ml-1"
            title="Deselect (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
