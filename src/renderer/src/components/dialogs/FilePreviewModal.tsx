import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileText,
  FileCode,
  Image as ImageIcon,
  Loader2,
  File,
} from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import { useFolderStore } from '../../store/folderStore';
import { GitHubService } from '../../services/github';

export const FilePreviewModal: React.FC = () => {
  const { previewFile, setPreviewFile, downloadFile } = useFileStore();
  const { currentRepo } = useFolderStore();

  const [textContent, setTextContent] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const file = previewFile;

  useEffect(() => {
    if (!file || !currentRepo) {
      setTextContent(null);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      return;
    }

    const [owner, repo] = currentRepo.full_name.split('/');
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    const isPdf = ext === 'pdf';
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
    const isTextOrCode = [
      'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx',
      'html', 'css', 'scss', 'py', 'go', 'rs', 'c',
      'cpp', 'h', 'java', 'yml', 'yaml', 'toml', 'xml',
      'sh', 'bash', 'zsh', 'env', 'sql', 'gitignore', 'lock',
    ].includes(ext) || !ext;

    if (isPdf) {
      // Create blob URL for PDF for crisp native viewer rendering
      setIsLoadingContent(true);
      GitHubService.getFileContent(owner, repo, file.path)
        .then((res) => {
          const binaryString = atob(res.content.replace(/\s/g, ''));
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setIsLoadingContent(false);
        })
        .catch((err) => {
          console.error('Failed to load PDF preview:', err);
          if (file.download_url) {
            setBlobUrl(file.download_url);
          } else {
            setError('Could not load PDF preview');
          }
          setIsLoadingContent(false);
        });
    } else if (isTextOrCode) {
      setIsLoadingContent(true);
      GitHubService.getFileContent(owner, repo, file.path)
        .then((res) => {
          try {
            const rawDecoded = decodeURIComponent(
              atob(res.content.replace(/\s/g, ''))
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            setTextContent(rawDecoded);
          } catch {
            setTextContent(atob(res.content.replace(/\s/g, '')));
          }
          setIsLoadingContent(false);
        })
        .catch((err) => {
          console.error('Failed to load file text:', err);
          setError('Could not load file contents');
          setIsLoadingContent(false);
        });
    }

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [file, currentRepo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPreviewFile]);

  if (!file || !currentRepo) return null;

  const [owner, repo] = currentRepo.full_name.split('/');
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);

  const handleCopy = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadFile(owner, repo, file);
  };

  const handleOpenGithub = () => {
    const url = `https://github.com/${owner}/${repo}/blob/${currentRepo.default_branch}/${file.path}`;
    const sys = window.gitdrive?.system || window.gitvault?.system;
    if (sys) {
      sys.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-150 select-none">
      <div className="bg-[#161b22] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-text-primary ring-1 ring-white/10">
        {/* Modal Top Header */}
        <div className="h-13 px-4 py-2 flex items-center justify-between bg-[#161b22] shrink-0 border-b border-white/5">
          <div className="flex items-center space-x-3 truncate mr-4">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-brand-400 shrink-0">
              {isPdf ? (
                <FileText className="w-4 h-4 text-accent-red" />
              ) : isImage ? (
                <ImageIcon className="w-4 h-4 text-accent-purple" />
              ) : (
                <FileCode className="w-4 h-4 text-accent-blue" />
              )}
            </div>
            <div className="truncate">
              <h2 className="text-sm font-semibold truncate leading-tight">{file.name}</h2>
              <div className="flex items-center space-x-2 text-[11px] text-text-muted mt-0.5">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="font-mono text-[10px]">{file.path}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {textContent && (
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-xs rounded-lg transition text-text-secondary hover:text-text-primary"
                title="Copy contents"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-accent-green" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow transition"
              title="Download file to computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={handleOpenGithub}
              className="p-2 hover:bg-white/5 text-text-muted hover:text-text-primary rounded-lg transition"
              title="Open on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={() => setPreviewFile(null)}
              className="p-2 hover:bg-white/5 text-text-muted hover:text-text-primary rounded-lg transition ml-1"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Seamless Preview Canvas (No enclosing border container) */}
        <div className="flex-1 overflow-hidden flex items-center justify-center min-h-[450px] bg-[#0d1117]">
          {isLoadingContent ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-3" />
              <p className="text-xs">Loading file preview...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 p-4">
              <p className="text-xs text-accent-red mb-3">{error}</p>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs rounded-lg"
              >
                Download to View
              </button>
            </div>
          ) : isPdf && blobUrl ? (
            <iframe
              src={blobUrl}
              title={file.name}
              className="w-full h-[82vh] border-0 bg-[#2b2b2b]"
            />
          ) : isImage ? (
            <div className="flex flex-col items-center justify-center p-6 w-full h-full">
              <img
                src={file.download_url || undefined}
                alt={file.name}
                className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>
          ) : textContent !== null ? (
            <div className="w-full h-[82vh] bg-[#0d1117] overflow-auto p-6 select-text">
              <pre className="font-mono text-xs leading-relaxed text-[#e6edf3] whitespace-pre-wrap break-all">
                {textContent}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-3 text-text-muted">
                <File className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-1">{file.name}</h4>
              <p className="text-xs text-text-muted mb-4 max-w-xs">
                Preview not supported for this file type. You can download it directly.
              </p>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg shadow"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
