import React, { useRef } from 'react';
import {
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  Upload,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { useFolderStore } from '../../store/folderStore';
import { useFileStore } from '../../store/fileStore';
import { useAuthStore } from '../../store/authStore';

export const Header: React.FC = () => {
  const { currentRepo, selectRepository, fetchRepositories, isLoading: isFolderLoading } = useFolderStore();
  const {
    currentPath,
    setCurrentPath,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    fetchFiles,
    uploadFiles,
    isUploading,
    isLoading: isFileLoading,
    files,
  } = useFileStore();
  const { token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefresh = () => {
    if (currentRepo) {
      const [owner, repoName] = currentRepo.full_name.split('/');
      fetchFiles(owner, repoName, currentPath);
    } else {
      fetchRepositories();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentRepo) return;
    const fileList = Array.from(e.target.files);
    const [owner, repoName] = currentRepo.full_name.split('/');
    await uploadFiles(owner, repoName, currentPath, fileList);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const subtitle = currentRepo
    ? `${files.length} ${files.length === 1 ? 'item' : 'items'}`
    : 'Cloud Storage Folders';

  return (
    <header className="h-13 bg-[#262626] border-b border-border flex items-center justify-between px-4 py-2 select-none shrink-0 titlebar-drag-region">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left: macOS Title & Breadcrumbs */}
      <div className="flex items-center space-x-3 titlebar-no-drag">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-text-primary">
            <button
              onClick={() => {
                selectRepository(null);
                setCurrentPath('');
              }}
              className={`hover:text-brand-500 transition ${
                !currentRepo ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              GitDrive
            </button>

            {currentRepo && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <button
                  onClick={() => setCurrentPath('')}
                  className={`hover:text-text-primary transition ${
                    pathParts.length === 0 ? 'text-text-primary' : 'text-text-secondary'
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
                    className={`hover:text-text-primary transition ${
                      isLast ? 'text-text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <div className="text-[11px] text-text-muted font-normal leading-tight mt-0.5">
            {subtitle}
          </div>
        </div>
      </div>

      {/* Right Controls: Apple Capsule Pill Buttons */}
      <div className="flex items-center space-x-2 titlebar-no-drag">
        {/* Search Pill */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={currentRepo ? 'Search files...' : 'Search folders...'}
            className="w-44 bg-[#1e1e1e] border border-border/80 rounded-lg pl-8 pr-2.5 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 transition"
          />
        </div>

        {/* View Mode Capsule */}
        <div className="flex items-center bg-[#1e1e1e] border border-border/80 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-1 rounded-md text-xs transition ${
              viewMode === 'grid'
                ? 'bg-[#383838] text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            className={`p-1 rounded-md text-xs transition ${
              viewMode === 'list'
                ? 'bg-[#383838] text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Refresh Capsule */}
        <button
          onClick={handleRefresh}
          disabled={isFolderLoading || isFileLoading}
          title="Refresh"
          className="p-1.5 bg-[#1e1e1e] border border-border/80 hover:bg-[#333333] text-text-secondary hover:text-text-primary rounded-lg text-xs transition disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isFolderLoading || isFileLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Open on GitHub */}
        {currentRepo && (
          <button
            onClick={handleOpenGithub}
            title="Open Repository on GitHub"
            className="p-1.5 bg-[#1e1e1e] border border-border/80 hover:bg-[#333333] text-text-secondary hover:text-text-primary rounded-lg text-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Upload File button in Apple Warm Amber / Gold */}
        {currentRepo && (
          <button
            onClick={handleUploadClick}
            disabled={!token || isUploading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-black rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
