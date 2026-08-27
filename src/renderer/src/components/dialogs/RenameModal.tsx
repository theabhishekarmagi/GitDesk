import React, { useState, useEffect, useRef } from 'react';
import { Edit2, AlertCircle, Loader2 } from 'lucide-react';
import { useFolderStore } from '../../store/folderStore';
import { useFileStore } from '../../store/fileStore';

export const RenameModal: React.FC = () => {
  const { renameModalTarget, setRenameModalTarget, renameFolder, currentRepo } = useFolderStore();
  const { renameFileTarget, setRenameFileTarget, renameFile } = useFileStore();

  const isFolder = !!renameModalTarget;
  const isFile = !!renameFileTarget;
  const isOpen = isFolder || isFile;

  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFolder && renameModalTarget) {
      setNewName(renameModalTarget.repo.name);
      setError(null);
    } else if (isFile && renameFileTarget) {
      setNewName(renameFileTarget.name);
      setError(null);
    }
  }, [renameModalTarget, renameFileTarget, isFolder, isFile]);

  // Focus and select the filename (excluding extension for files)
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      const dotIndex = newName.lastIndexOf('.');
      if (isFile && dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    if (isFolder) setRenameModalTarget(null);
    if (isFile) setRenameFileTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    if (!cleanName) {
      setError('Name cannot be empty');
      return;
    }

    if (isFolder && renameModalTarget) {
      const formatted = cleanName.replace(/\s+/g, '-');
      if (formatted === renameModalTarget.repo.name) {
        handleClose();
        return;
      }
      const [owner] = renameModalTarget.repo.full_name.split('/');
      setIsSubmitting(true);
      setError(null);
      try {
        await renameFolder(owner, renameModalTarget.repo.name, formatted);
        setIsSubmitting(false);
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err?.message || 'Failed to rename folder on GitHub');
      }
    } else if (isFile && renameFileTarget && currentRepo) {
      if (cleanName === renameFileTarget.name) {
        handleClose();
        return;
      }
      const [owner, repo] = currentRepo.full_name.split('/');
      setIsSubmitting(true);
      setError(null);
      try {
        await renameFile(owner, repo, renameFileTarget, cleanName);
        setIsSubmitting(false);
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err?.message || 'Failed to rename file on GitHub');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 text-text-primary">
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
            <Edit2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">
              Rename {isFolder ? 'Folder' : 'File'}
            </h2>
            <p className="text-xs text-text-muted">
              Enter a new name for{' '}
              <span className="font-mono text-text-secondary">
                {isFolder ? renameModalTarget?.repo.name : renameFileTarget?.name}
              </span>
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-xs text-accent-red mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              New Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              className="w-full bg-surface-subtle border border-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted transition outline-none"
              placeholder={isFolder ? 'my-folder-name' : 'document.pdf'}
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle border border-border transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Renaming...</span>
                </>
              ) : (
                <span>Rename</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
