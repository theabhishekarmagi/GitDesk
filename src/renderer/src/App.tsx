import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { FolderView } from './components/views/FolderView';
import { AuthModal } from './components/auth/AuthModal';
import { NewFolderModal } from './components/dialogs/NewFolderModal';
import { HistoryModal } from './components/dialogs/HistoryModal';
import { useAuthStore } from './store/authStore';
import { useFolderStore } from './store/folderStore';

export const App: React.FC = () => {
  const { checkExistingAuth, isLoading: isAuthChecking } = useAuthStore();
  const { currentRepo } = useFolderStore();

  useEffect(() => {
    checkExistingAuth();
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
    </div>
  );
};

export default App;
