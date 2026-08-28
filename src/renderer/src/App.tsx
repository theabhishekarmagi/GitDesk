import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { FolderView } from './components/views/FolderView';
import { AuthModal } from './components/auth/AuthModal';
import { NewFolderModal } from './components/dialogs/NewFolderModal';
import { HistoryModal } from './components/dialogs/HistoryModal';
import { FilePreviewModal } from './components/dialogs/FilePreviewModal';
import { RenameModal } from './components/dialogs/RenameModal';
import { BatchActionBar } from './components/layout/BatchActionBar';
import { useAuthStore } from './store/authStore';
import { useFolderStore } from './store/folderStore';
import { useSyncStore } from './store/syncStore';

export const App: React.FC = () => {
  const { checkExistingAuth, isLoading: isAuthChecking } = useAuthStore();
  const { currentRepo } = useFolderStore();
  const { initSync } = useSyncStore();

  useEffect(() => {
    checkExistingAuth();
    initSync();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden select-none">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content pane */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
        <Header />
        <div className="flex-1 flex flex-col min-h-0 relative">
          {currentRepo ? <FolderView /> : <DashboardView />}
        </div>
      </main>

      {/* Dialog Modals */}
      <AuthModal />
      <NewFolderModal />
      <HistoryModal />
      <FilePreviewModal />
      <RenameModal />

      {/* Floating Batch Action Bar */}
      <BatchActionBar />
    </div>
  );
};

export default App;
