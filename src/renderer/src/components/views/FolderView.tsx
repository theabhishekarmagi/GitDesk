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
  ExternalLink,
} from 'lucide-react';
import { useFolderStore } from '../../store/folderStore';
import { useFileStore } from '../../store/fileStore';
import { FileItem } from '@shared/types';

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

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'dir') {
      return <Folder className="w-5 h-5 text-accent-blue fill-current/20" />;
    }
    const ext = item.name.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-accent-purple" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'json', 'html', 'css', 'go', 'rs'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-accent-amber" />;
    }
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return <FileArchive className="w-5 h-5 text-accent-red" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
      return <FileText className="w-5 h-5 text-brand-500" />;
    }
    return <File className="w-5 h-5 text-text-muted" />;
  };

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'dir') {
      const nextPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      setCurrentPath(nextPath);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full relative overflow-hidden transition-colors ${
        isDragOver ? 'bg-brand-500/5' : 'bg-background'
      }`}
    >
      {/* Uploading Banner */}
      {isUploading && (
        <div className="bg-brand-600/90 text-white px-4 py-2 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{uploadStatusText || 'Committing file to GitHub storage...'}</span>
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
        <div className="p-3 m-4 mb-0 rounded-lg bg-accent-red/10 border border-accent-red/30 text-xs text-accent-red">
          {error}
        </div>
      )}

      {/* File List Content */}
      <div className="flex-1 overflow-y-auto p-6">
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
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {files.map((file) => (
              <div
                key={file.path}
                onDoubleClick={() => handleItemClick(file)}
                className="group relative bg-surface hover:bg-surface-subtle border border-border hover:border-border/80 rounded-xl p-3 flex flex-col items-center text-center cursor-pointer transition select-none"
              >
                <div className="w-12 h-12 rounded-lg bg-surface-subtle group-hover:bg-surface flex items-center justify-center mb-2 transition">
                  {getFileIcon(file)}
                </div>

                <span className="text-xs font-medium text-text-primary truncate w-full mb-1" title={file.name}>
                  {file.name}
                </span>

                <span className="text-[10px] text-text-muted">
                  {file.type === 'dir' ? 'Folder' : formatFileSize(file.size)}
                </span>

                {/* Hover Quick Actions */}
                {file.type === 'file' && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center space-x-1 bg-surface border border-border rounded-md p-1 shadow-md transition">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="border border-border rounded-xl overflow-hidden bg-surface">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-subtle/50 text-[11px] text-text-muted font-medium">
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4 w-32">Size</th>
                  <th className="py-2.5 px-4 w-28">Type</th>
                  <th className="py-2.5 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {files.map((file) => (
                  <tr
                    key={file.path}
                    onDoubleClick={() => handleItemClick(file)}
                    className="hover:bg-surface-subtle/60 group cursor-pointer transition"
                  >
                    <td className="py-2.5 px-4 flex items-center space-x-2.5">
                      <div className="shrink-0">{getFileIcon(file)}</div>
                      <span className="font-medium text-text-primary truncate max-w-md">{file.name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-text-muted font-mono">
                      {file.type === 'dir' ? '—' : formatFileSize(file.size)}
                    </td>
                    <td className="py-2.5 px-4 text-text-muted capitalize">{file.type}</td>
                    <td className="py-2.5 px-4 text-right">
                      {file.type === 'file' ? (
                        <div className="flex items-center justify-end space-x-1.5 opacity-0 group-hover:opacity-100 transition">
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
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted">Double-click to open</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
