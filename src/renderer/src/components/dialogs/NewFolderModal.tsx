import React, { useState } from 'react';
import { FolderPlus, Lock, Globe, AlertCircle } from 'lucide-react';
import { useFolderStore } from '../../store/folderStore';

export const NewFolderModal: React.FC = () => {
  const { isNewFolderModalOpen, setNewFolderModalOpen, createFolder, isLoading, error } = useFolderStore();
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  if (!isNewFolderModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = folderName.trim().replace(/\s+/g, '-');
    if (!cleanName) return;

    try {
      await createFolder(cleanName, description.trim(), isPrivate);
      setFolderName('');
      setDescription('');
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 text-text-primary">
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Create New Folder</h2>
            <p className="text-xs text-text-muted">Creates a dedicated GitDrive folder on your GitHub account</p>
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
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Tax-Documents-2026"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Scanned invoices and receipts"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Privacy Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center space-x-2 p-2.5 rounded-lg border text-left text-xs transition ${
                  isPrivate
                    ? 'border-brand-500 bg-brand-500/10 text-text-primary'
                    : 'border-border bg-background text-text-muted hover:text-text-secondary'
                }`}
              >
                <Lock className={`w-4 h-4 ${isPrivate ? 'text-brand-500' : 'text-text-muted'}`} />
                <div>
                  <div className="font-semibold">Private (Recommended)</div>
                  <div className="text-[10px] text-text-muted">Only you can access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center space-x-2 p-2.5 rounded-lg border text-left text-xs transition ${
                  !isPrivate
                    ? 'border-accent-blue bg-accent-blue/10 text-text-primary'
                    : 'border-border bg-background text-text-muted hover:text-text-secondary'
                }`}
              >
                <Globe className={`w-4 h-4 ${!isPrivate ? 'text-accent-blue' : 'text-text-muted'}`} />
                <div>
                  <div className="font-semibold">Public</div>
                  <div className="text-[10px] text-text-muted">Anyone can view</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setNewFolderModalOpen(false)}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-subtle border border-border transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !folderName.trim()}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-[#3a3a3c] hover:bg-[#48484a] border border-white/10 disabled:opacity-50 text-white shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <span>{isLoading ? 'Creating on GitHub...' : 'Create Folder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
