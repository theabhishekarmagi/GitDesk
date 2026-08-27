import React, { useState } from 'react';
import { Github, Key, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, loginWithToken, isLoading, error } = useAuthStore();
  const [tokenInput, setTokenInput] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    const success = await loginWithToken(tokenInput.trim());
    if (success) {
      setTokenInput('');
    }
  };

  const handleOpenTokenPage = () => {
    const url = 'https://github.com/settings/tokens/new?scopes=repo&description=GitVault%20Desktop';
    if (window.gitvault?.system) {
      window.gitvault.system.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 text-text-primary">
        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-border flex items-center justify-center">
            <Github className="w-6 h-6 text-text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Connect to GitHub</h2>
            <p className="text-xs text-text-muted">Turn your GitHub account into your cloud storage</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-surface-subtle border border-border/80 text-xs text-text-secondary mb-5">
          <ShieldCheck className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <p>
            Your access token is encrypted in your system keychain using Electron's native{' '}
            <code className="text-accent-blue font-mono">safeStorage</code>. We never send your credentials to any third-party server.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-xs text-accent-red mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Token Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="token" className="text-xs font-medium text-text-secondary flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Personal Access Token (classic)</span>
              </label>
              <button
                type="button"
                onClick={handleOpenTokenPage}
                className="text-[11px] text-accent-blue hover:underline flex items-center space-x-0.5"
              >
                <span>Generate Token</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            </div>
            <input
              id="token"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              required
            />
            <p className="text-[11px] text-text-muted mt-1.5">
              Required permission scope: <span className="text-text-secondary font-mono">repo</span> (Full control of repositories).
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium text-text-secondary hover:bg-surface-subtle border border-border transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !tokenInput.trim()}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white shadow transition flex items-center justify-center space-x-1.5"
            >
              <span>{isLoading ? 'Verifying...' : 'Connect Drive'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
