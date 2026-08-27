import React from 'react';
import {
  ChevronRight,
  Folder,
  Upload,
  LayoutGrid,
  List,
  Search,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { useFolderStore } from '../../store/folderStore';
import { useFileStore } from '../../store/fileStore';
import { useAuthStore } from '../../store/authStore';

export const Header: React.FC = () => {
  const { token } = useAuthStore();
  const { currentRepo, selectRepository, searchQuery, setSearchQuery, fetchRepositories, isLoading: isFolderLoading } =
    useFolderStore();
  const {
    viewMode,
    setViewMode,
    currentPath,
    setCurrentPath,
    uploadFiles,
    fetchFiles,
    isLoading: isFileLoading,
    isUploading,
  } = useFileStore();

  const handleUploadClick = async () => {
    if (!currentRepo) return;
    const [owner, repoName] = currentRepo.full_name.split('/');

    const dialogApi = window.gitdrive?.dialog || window.gitvault?.dialog;
    if (dialogApi) {
      const res = await dialogApi.openFileDialog();
      if (!res.canceled && res.files.length > 0) {
        await uploadFiles(owner, repoName, res.files);
      }
    } else {
      // Fallback for browser testing
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.onchange = async (e: any) => {
        const fileList: FileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        const uploads = await Promise.all(
          Array.from(fileList).map(async (file) => {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            return {
              name: file.name,
              path: file.name,
              size: file.size,
              base64,
            };
          })
        );

        await uploadFiles(owner, repoName, uploads);
      };
      input.click();
    }
  };

  const handleRefresh = () => {
    if (currentRepo) {
      const [owner, repoName] = currentRepo.full_name.split('/');
      fetchFiles(owner, repoName, currentPath);
    } else {
      fetchRepositories();
    }
  };

  const handleOpenGithub = () => {
    const url = currentRepo ? currentRepo.html_url : 'https://github.com';
    const sys = window.gitdrive?.system || window.gitvault?.system;
    if (sys) {
      sys.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <header className="h-14 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 select-none shrink-0">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-1.5 text-xs">
        <button
          onClick={() => {
            selectRepository(null);
            setCurrentPath('');
          }}
          className={`flex items-center space-x-1 px-1.5 py-1 rounded transition ${
            !currentRepo ? 'text-text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Folder className="w-3.5 h-3.5 text-accent-blue" />
          <span>All Folders</span>
        </button>

        {currentRepo && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <button
              onClick={() => setCurrentPath('')}
              className={`px-1.5 py-1 rounded transition font-medium ${
                pathParts.length === 0 ? 'text-text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {currentRepo.name}
            </button>
          </>
        )}

        {pathParts.map((part, index) => {
          const isLast = index === pathParts.length - 1;
          const subPath = pathParts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={subPath}>
              <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <button
                onClick={() => setCurrentPath(subPath)}
                className={`px-1.5 py-1 rounded transition ${
                  isLast ? 'text-text-primary font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Right Controls: Search, View Mode, Upload, Refresh */}
      <div className="flex items-center space-x-2">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentRepo ? 'Filter files...' : 'Search folders...'}
            className="w-48 bg-surface border border-border rounded-md pl-8 pr-2.5 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-surface border border-border rounded-md p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-1 rounded text-xs transition ${
              viewMode === 'grid' ? 'bg-surface-subtle text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            className={`p-1 rounded text-xs transition ${
              viewMode === 'list' ? 'bg-surface-subtle text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isFolderLoading || isFileLoading}
          title="Refresh"
          className="p-1.5 bg-surface border border-border hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-md text-xs transition disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFolderLoading || isFileLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* View on GitHub */}
        {currentRepo && (
          <button
            onClick={handleOpenGithub}
            title="Open Repository on GitHub"
            className="p-1.5 bg-surface border border-border hover:bg-surface-subtle text-text-secondary hover:text-text-primary rounded-md text-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Upload File button (active when inside a folder) */}
        {currentRepo && (
          <button
            onClick={handleUploadClick}
            disabled={!token || isUploading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
