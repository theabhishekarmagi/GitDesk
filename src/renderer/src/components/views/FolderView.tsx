import React, { useEffect, useState } from 'react';
import {
  Folder,
  File,
  FileText,
  FileCode,
  Image as ImageIcon,
  FileArchive,
  Download,
  Trash2,
  History,
  Upload,
  Loader2,
  Edit2,
  Eye,
  Check,
} from 'lucide-react';
import { useFolderStore } from '../../store/folderStore';
import { useFileStore } from '../../store/fileStore';
import { FileItem } from '@shared/types';

// Native macOS / Windows Desktop File Icon component
const DesktopFileIcon: React.FC<{ file: FileItem; size?: 'sm' | 'lg' }> = ({ file, size = 'lg' }) => {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Compact icon for List View
  if (size === 'sm') {
    if (file.type === 'dir') {
      return <Folder className="w-4 h-4 text-[#54a3ff] fill-current/30 shrink-0" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return <ImageIcon className="w-4 h-4 text-[#a371f7] shrink-0" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'go', 'rs', 'c', 'cpp'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-[#79c0ff] shrink-0" />;
    }
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return <FileArchive className="w-4 h-4 text-[#f0883e] shrink-0" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-4 h-4 text-[#e5534b] shrink-0" />;
    }
    if (ext === 'md') {
      return <FileText className="w-4 h-4 text-[#58a6ff] shrink-0" />;
    }
    return <File className="w-4 h-4 text-text-muted shrink-0" />;
  }

  // Large desktop icon for Grid View
  if (file.type === 'dir') {
    return (
      <div className="w-16 h-14 relative flex items-center justify-center filter drop-shadow-md">
        <svg viewBox="0 0 64 52" className="w-16 h-14 text-[#54a3ff] fill-current">
          <path d="M4 8C4 5.79086 5.79086 4 8 4H22.3431C23.404 4 24.4214 4.42143 25.1716 5.17157L28.8284 8.82843C29.5786 9.57857 30.596 10 31.6569 10H56C58.2091 10 60 11.7909 60 14V44C60 46.2091 58.2091 48 56 48H8C5.79086 48 4 46.2091 4 44V8Z" />
          <path d="M4 18C4 15.7909 5.79086 14 8 14H56C58.2091 14 60 15.7909 60 18V44C60 46.2091 58.2091 48 56 48H8C5.79086 48 4 46.2091 4 44V18Z" fill="#79c0ff" />
        </svg>
      </div>
    );
  }

  // Image file preview
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) && file.download_url) {
    return (
      <div className="w-14 h-16 rounded-lg bg-white/10 p-1 shadow-lg border border-white/20 flex items-center justify-center overflow-hidden">
        <img
          src={file.download_url}
          alt={file.name}
          className="w-full h-full object-cover rounded"
          loading="lazy"
        />
      </div>
    );
  }

  // Realistic macOS Document Sheet Icon with folded corner
  return (
    <div className="w-14 h-16 relative bg-gradient-to-b from-[#ffffff] to-[#e6edf3] rounded-md shadow-md border border-[#d0d7de]/60 flex flex-col justify-between p-2 overflow-hidden select-none">
      {/* Dog-ear fold top right */}
      <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#cfd7df] shadow-sm [clip-path:polygon(0_0,100%_100%,0_100%)]" />

      {/* Inside document icon lines or badge */}
      {ext === 'pdf' ? (
        <div className="flex flex-col h-full justify-between pt-1">
          <div className="space-y-1 opacity-40">
            <div className="w-6 h-0.5 bg-gray-700 rounded" />
            <div className="w-8 h-0.5 bg-gray-700 rounded" />
            <div className="w-5 h-0.5 bg-gray-700 rounded" />
          </div>
          <div className="bg-[#e5534b] text-white font-bold text-[8px] px-1 py-0.5 rounded text-center uppercase tracking-tight shadow-sm">
            PDF
          </div>
        </div>
      ) : ['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css'].includes(ext) ? (
        <div className="flex flex-col h-full justify-between pt-1">
          <div className="space-y-1 opacity-50">
            <div className="w-6 h-0.5 bg-[#0969da] rounded" />
            <div className="w-7 h-0.5 bg-[#0969da] rounded" />
            <div className="w-5 h-0.5 bg-[#0969da] rounded" />
          </div>
          <div className="bg-[#1f2328] text-[#79c0ff] font-mono font-bold text-[8px] px-1 py-0.5 rounded text-center uppercase shadow-sm">
            {ext}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-between pt-1">
          <div className="space-y-1 opacity-40">
            <div className="w-6 h-0.5 bg-gray-600 rounded" />
            <div className="w-8 h-0.5 bg-gray-600 rounded" />
            <div className="w-5 h-0.5 bg-gray-600 rounded" />
            <div className="w-7 h-0.5 bg-gray-600 rounded" />
          </div>
          <div className="text-[8px] text-gray-500 font-bold uppercase text-center">
            {ext || 'DOC'}
          </div>
        </div>
      )}
    </div>
  );
};

export const FolderView: React.FC = () => {
  const { currentRepo } = useFolderStore();
  const {
    files,
    currentPath,
    setCurrentPath,
    fetchFiles,
    uploadFiles,
    downloadFile,
    deleteFile,
    viewHistory,
    viewMode,
    isLoading,
    isUploading,
    uploadStatusText,
    error,
    selectedFilePaths,
    toggleSelectFile,
    clearFileSelection,
    setPreviewFile,
    setRenameFileTarget,
  } = useFileStore();

  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (currentRepo) {
      const [owner, repoName] = currentRepo.full_name.split('/');
      fetchFiles(owner, repoName, currentPath);
    }
  }, [currentRepo, currentPath]);

  if (!currentRepo) return null;

  const [owner, repoName] = currentRepo.full_name.split('/');

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const uploads = await Promise.all(
      Array.from(droppedFiles).map(async (file) => {
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'dir') {
      const nextPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      setCurrentPath(nextPath);
    } else {
      setPreviewFile(item);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          clearFileSelection();
        }
      }}
      className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors ${
        isDragOver ? 'bg-brand-500/5' : 'bg-background'
      }`}
    >
      {/* Uploading Banner */}
      {isUploading && (
        <div className="bg-[#2c2c2e] border-b border-white/10 text-white px-4 py-2 text-xs flex items-center justify-between font-medium shadow-sm shrink-0">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{uploadStatusText || 'Committing file to GitDrive...'}</span>
          </div>
        </div>
      )}

      {/* Drag overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 border-2 border-dashed border-brand-500 bg-surface/90 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <Upload className="w-12 h-12 text-brand-500 animate-bounce mb-3" />
          <h3 className="text-base font-bold text-text-primary">Drop files here to upload</h3>
          <p className="text-xs text-text-muted">Files will be committed to {currentRepo.name}</p>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="p-3 m-4 mb-0 rounded-lg bg-accent-red/10 border border-accent-red/30 text-xs text-accent-red shrink-0">
          {error}
        </div>
      )}

      {/* File Content Area */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            clearFileSelection();
          }
        }}
        className="flex-1 overflow-y-auto p-6"
      >
        {isLoading && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Loader2 className="w-7 h-7 animate-spin text-brand-500 mb-2" />
            <span className="text-xs">Fetching repository contents...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl">
            <Upload className="w-10 h-10 text-text-muted mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">This folder is empty</h3>
            <p className="text-xs text-text-muted max-w-xs mb-4">
              Drag and drop any files here, or use the Upload button in the top bar to save files.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Native macOS / Windows Style Borderless Grid View */
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                clearFileSelection();
              }
            }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-x-4 gap-y-6 select-none"
          >
            {files.map((file) => {
              const isSelected = selectedFilePaths.has(file.path);
              return (
                <div
                  key={file.path}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectFile(file.path, e.metaKey || e.ctrlKey);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleItemDoubleClick(file);
                  }}
                  className={`group relative flex flex-col items-center cursor-pointer transition select-none p-2.5 rounded-xl ${
                    isSelected
                      ? 'bg-[#383838] ring-1 ring-white/15'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* File/Folder Icon (No enclosing box border) */}
                  <div className="mb-2 flex items-center justify-center transition group-hover:scale-105">
                    <DesktopFileIcon file={file} size="lg" />
                  </div>

                  {/* Centered Filename with macOS Selection Pill */}
                  <span
                    className={`text-[12px] leading-tight text-center max-w-[110px] break-words line-clamp-2 px-1.5 py-0.5 rounded transition ${
                      isSelected
                        ? 'bg-accent-blue text-white font-medium shadow-sm'
                        : 'text-text-primary group-hover:text-white'
                    }`}
                    title={file.name}
                  >
                    {file.name}
                  </span>

                  {/* Subtitle / File Size */}
                  {file.type !== 'dir' && (
                    <span className="text-[10px] text-text-muted mt-0.5">
                      {formatFileSize(file.size)}
                    </span>
                  )}

                  {/* Quick Action Floating Pill on Hover */}
                  <div className="absolute -top-2 right-1 opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 bg-[#2c2c2e]/95 backdrop-blur-md border border-white/10 rounded-lg p-1 shadow-lg transition z-10">
                    {file.type === 'file' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewFile(file);
                        }}
                        title="Quick Preview"
                        className="p-1 text-text-muted hover:text-brand-400 rounded transition"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameFileTarget(file);
                      }}
                      title="Rename"
                      className="p-1 text-text-muted hover:text-text-primary rounded transition"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {file.type === 'file' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(owner, repoName, file);
                          }}
                          title="Download"
                          className="p-1 text-text-muted hover:text-brand-500 rounded transition"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewHistory(owner, repoName, file);
                          }}
                          title="Version History"
                          className="p-1 text-text-muted hover:text-accent-blue rounded transition"
                        >
                          <History className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                              deleteFile(owner, repoName, file);
                            }
                          }}
                          title="Delete"
                          className="p-1 text-text-muted hover:text-accent-red rounded transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View - Completely Borderless Finder Style */
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                clearFileSelection();
              }
            }}
            className="w-full select-none"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/30 text-[11px] text-text-muted font-medium">
                  <th className="pb-2.5 px-3 font-medium">Name</th>
                  <th className="pb-2.5 px-3 w-32 font-medium">Size</th>
                  <th className="pb-2.5 px-3 w-28 font-medium">Kind</th>
                  <th className="pb-2.5 px-3 w-36 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {files.map((file) => {
                  const isSelected = selectedFilePaths.has(file.path);
                  return (
                    <tr
                      key={file.path}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectFile(file.path, e.metaKey || e.ctrlKey);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleItemDoubleClick(file);
                      }}
                      className={`group cursor-pointer transition rounded-lg ${
                        isSelected
                          ? 'bg-[#383838] text-white font-medium shadow-sm'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="py-2 px-3 flex items-center space-x-2.5">
                        <DesktopFileIcon file={file} size="sm" />
                        <span className="font-medium text-text-primary truncate max-w-md">{file.name}</span>
                      </td>
                      <td className="py-2 px-3 text-text-muted font-mono text-[11px]">
                        {file.type === 'dir' ? '—' : formatFileSize(file.size)}
                      </td>
                      <td className="py-2 px-3 text-text-muted capitalize text-[11px]">
                        {file.type === 'dir' ? 'Folder' : file.name.split('.').pop()?.toUpperCase() || 'File'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition">
                          {file.type === 'file' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                              title="Preview"
                              className="p-1 text-text-muted hover:text-brand-400 rounded transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameFileTarget(file);
                            }}
                            title="Rename"
                            className="p-1 text-text-muted hover:text-text-primary rounded transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {file.type === 'file' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFile(owner, repoName, file);
                                }}
                                title="Download"
                                className="p-1 text-text-muted hover:text-brand-500 rounded transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewHistory(owner, repoName, file);
                                }}
                                title="Version History"
                                className="p-1 text-text-muted hover:text-accent-blue rounded transition"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                                    deleteFile(owner, repoName, file);
                                  }
                                }}
                                title="Delete"
                                className="p-1 text-text-muted hover:text-accent-red rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
