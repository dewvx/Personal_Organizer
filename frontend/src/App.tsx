import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { CategoryService } from './services/categoryService';
import { EntryService } from './services/entryService';
import { AttachmentService } from './services/attachmentService';
import { Category, Entry } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { EntryFormModal } from './components/entries/EntryFormModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { PinLockModal } from './components/common/PinLockModal';
import { QuickCaptureBar } from './components/entries/QuickCaptureBar';
import { OfflineBanner } from './components/common/OfflineBanner';
import { AuthService } from './services/authService';
import { useNetworkSync } from './hooks/useNetworkSync';

// Primary Pages (Eagerly Loaded)
import { DashboardPage } from './pages/DashboardPage';
import { AllListsPage } from './pages/AllListsPage';

// Secondary Pages (Code-Split / Lazy Loaded)
const CalendarViewPage = lazy(() => import('./pages/CalendarViewPage').then((m) => ({ default: m.CalendarViewPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ArchivePage = lazy(() => import('./pages/ArchivePage').then((m) => ({ default: m.ArchivePage })));
const KanbanBoardPage = lazy(() => import('./pages/KanbanBoardPage').then((m) => ({ default: m.KanbanBoardPage })));
const GoalsPage = lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })));

// Heavy Modals (Lazy Loaded on Demand)
const ShoppingModeModal = lazy(() => import('./components/entries/ShoppingModeModal').then((m) => ({ default: m.ShoppingModeModal })));
const ImportModal = lazy(() => import('./components/common/ImportModal').then((m) => ({ default: m.ImportModal })));
const NotificationSettingsModal = lazy(() => import('./components/common/NotificationSettingsModal').then((m) => ({ default: m.NotificationSettingsModal })));
const TemplatesModal = lazy(() => import('./components/templates/TemplatesModal').then((m) => ({ default: m.TemplatesModal })));
const EncryptedBackupModal = lazy(() => import('./components/common/EncryptedBackupModal').then((m) => ({ default: m.EncryptedBackupModal })));

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'all' | 'kanban' | 'goals' | 'calendar' | 'categories' | 'favorites' | 'archive'>('dashboard');
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Offline-First Sync & Network Status (FEAT-D1)
  const { isOnline, isSyncing, pendingCount, syncNow } = useNetworkSync(() => {
    setRefreshKey((k) => k + 1);
  });
  
  // Modals & Mobile Focus States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [defaultEntryCategoryId, setDefaultEntryCategoryId] = useState<number | undefined>(undefined);
  const [defaultEntryDate, setDefaultEntryDate] = useState<string | undefined>(undefined);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shoppingModeEntry, setShoppingModeEntry] = useState<Entry | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isEncryptedBackupModalOpen, setIsEncryptedBackupModalOpen] = useState(false);

  // PIN Lock Security States (Server-side Bcrypt Hash)
  const [isPinSet, setIsPinSet] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'unlock' | 'set' | 'disable'>('unlock');

  const { showToast } = useToast();

  const checkPinStatus = useCallback(async () => {
    try {
      localStorage.removeItem('app_pin_code'); // Clean legacy plaintext
      const status = await AuthService.getPinStatus();
      setIsPinSet(status.hasPin);
      if (status.hasPin) {
        const isUnlockedThisSession = sessionStorage.getItem('app_unlocked') === 'true' && !!sessionStorage.getItem('app_auth_token');
        setIsLocked(!isUnlockedThisSession);
      } else {
        setIsLocked(false);
      }
    } catch (err) {
      console.error('Failed to get PIN status', err);
    }
  }, []);

  useEffect(() => {
    checkPinStatus();
  }, [checkPinStatus]);

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await CategoryService.getAll();
      setCategories(res);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Tab change handler
  const handleSelectTab = (tab: string, categoryId?: number) => {
    setCurrentTab(tab as any);
    setActiveCategoryId(categoryId);
  };

  // Entry Actions
  const handleOpenNewEntry = (categoryPresetId?: number, datePreset?: string) => {
    setEditingEntry(null);
    setDefaultEntryCategoryId(categoryPresetId || activeCategoryId);
    setDefaultEntryDate(datePreset);
    setIsEntryModalOpen(true);
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleEntrySubmit = async (data: Partial<Entry>, files?: File[]) => {
    let savedEntry: Entry;
    if (editingEntry) {
      savedEntry = await EntryService.update(editingEntry.id, data);
      showToast('อัปเดตรายการเรียบร้อย');
    } else {
      savedEntry = await EntryService.create(data);
      showToast('สร้างรายการใหม่สำเร็จ');
    }

    if (files && files.length > 0 && savedEntry?.id) {
      try {
        await AttachmentService.upload(savedEntry.id, files);
      } catch (attErr) {
        showToast('บันทึกรายการสำเร็จ แต่เกิดข้อผิดพลาดในการอัปโหลดไฟล์แนบ', 'error');
      }
    }

    loadCategories();
    setRefreshKey((k) => k + 1);
  };

  const handleConfirmDeleteEntry = async () => {
    if (!deletingEntryId) return;
    try {
      setIsDeleting(true);
      await EntryService.delete(deletingEntryId);
      setDeletingEntryId(null);
      showToast('ลบรายการเรียบร้อย');
      loadCategories();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast('ไม่สามารถลบรายการได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicateEntry = async (id: number) => {
    try {
      await EntryService.duplicate(id);
      showToast('คัดลอกรายการเรียบร้อย');
      setRefreshKey((k) => k + 1);
      loadCategories();
    } catch (err) {
      showToast('ไม่สามารถคัดลอกรายการได้', 'error');
    }
  };

  const handleToggleShoppingItem = async (itemId: number, currentCompleted: boolean) => {
    try {
      const updated = await EntryService.toggleSubItem(itemId, currentCompleted);
      setShoppingModeEntry(updated);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      showToast('ไม่สามารถอัปเดตรายการซื้อของได้', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onOpenNewEntry={() => handleOpenNewEntry()}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Offline Banner (FEAT-D1) */}
        <OfflineBanner
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          onSyncNow={syncNow}
        />

        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q && currentTab !== 'all') {
              setCurrentTab('all');
            }
          }}
          onOpenNewEntry={() => handleOpenNewEntry()}
          onOpenImport={() => setIsImportModalOpen(true)}
          onOpenTemplates={() => setIsTemplatesModalOpen(true)}
          onOpenEncryptedBackup={() => setIsEncryptedBackupModalOpen(true)}
          onLockApp={() => {
            sessionStorage.removeItem('app_unlocked');
            sessionStorage.removeItem('app_auth_token');
            setIsLocked(true);
            setPinModalMode('unlock');
            setIsPinModalOpen(true);
          }}
          onConfigurePin={(mode) => {
            setPinModalMode(mode);
            setIsPinModalOpen(true);
          }}
          isPinSet={isPinSet}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
        />

        {/* Page Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Frictionless 3-Second Quick Capture Bar */}
          <QuickCaptureBar
            categories={categories}
            onEntryCreated={() => {
              loadCategories();
              setRefreshKey((k) => k + 1);
            }}
          />

          <Suspense fallback={
            <div className="flex justify-center items-center py-20 text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
            {currentTab === 'dashboard' && (
              <DashboardPage
                key={`dashboard_${refreshKey}`}
                onOpenNewEntry={() => handleOpenNewEntry()}
                onNavigateTab={(tab, catId) => handleSelectTab(tab, catId)}
                onEditEntry={handleEditEntry}
                onDeleteEntry={(id) => setDeletingEntryId(id)}
                onDuplicate={handleDuplicateEntry}
                onOpenShoppingMode={(entry) => setShoppingModeEntry(entry)}
              />
            )}

            {currentTab === 'all' && (
              <AllListsPage
                key={`all_${refreshKey}`}
                categories={categories}
                searchQuery={searchQuery}
                initialCategoryId={activeCategoryId}
                onOpenNewEntry={handleOpenNewEntry}
                onEditEntry={handleEditEntry}
                onDeleteEntry={(id) => setDeletingEntryId(id)}
                onDuplicate={handleDuplicateEntry}
                onOpenShoppingMode={(entry) => setShoppingModeEntry(entry)}
              />
            )}

            {currentTab === 'kanban' && (
              <KanbanBoardPage
                key={`kanban_${refreshKey}`}
                categories={categories}
                onOpenNewEntry={handleOpenNewEntry}
                onEditEntry={handleEditEntry}
                onDeleteEntry={(id) => setDeletingEntryId(id)}
                onOpenShoppingMode={(entry) => setShoppingModeEntry(entry)}
              />
            )}

            {currentTab === 'goals' && (
              <GoalsPage
                key={`goals_${refreshKey}`}
                onOpenEntryForm={(entry) => {
                  if (entry) {
                    setEditingEntry(entry);
                  }
                  setIsEntryModalOpen(true);
                }}
              />
            )}

            {currentTab === 'calendar' && (
              <CalendarViewPage
                key={`calendar_${refreshKey}`}
                onOpenNewEntry={(datePreset) => handleOpenNewEntry(undefined, datePreset)}
                onEditEntry={handleEditEntry}
                onDeleteEntry={(id) => setDeletingEntryId(id)}
                onDuplicate={handleDuplicateEntry}
                onOpenShoppingMode={(entry) => setShoppingModeEntry(entry)}
              />
            )}

            {currentTab === 'categories' && (
              <CategoriesPage
                key={`categories_${refreshKey}`}
                categories={categories}
                onRefreshCategories={loadCategories}
                onViewCategoryEntries={(catId) => handleSelectTab('all', catId)}
              />
            )}

            {currentTab === 'favorites' && (
              <FavoritesPage
                key={`favorites_${refreshKey}`}
                onEditEntry={handleEditEntry}
                onDeleteEntry={(id) => setDeletingEntryId(id)}
                onNavigateAll={() => handleSelectTab('all')}
                onDuplicate={handleDuplicateEntry}
                onOpenShoppingMode={(entry) => setShoppingModeEntry(entry)}
              />
            )}

            {currentTab === 'archive' && (
              <ArchivePage
                key={`archive_${refreshKey}`}
                onNavigateAll={() => handleSelectTab('all')}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenNewEntry={() => handleOpenNewEntry()}
      />

      {/* Entry Create / Edit Modal */}
      <EntryFormModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEditingEntry(null);
          setDefaultEntryDate(undefined);
        }}
        onSubmit={handleEntrySubmit}
        initialData={editingEntry}
        categories={categories}
        defaultCategoryId={defaultEntryCategoryId}
        defaultDate={defaultEntryDate}
      />

      {/* 4-digit PIN Passcode Lock Screen Modal */}
      <PinLockModal
        isOpen={isLocked || isPinModalOpen}
        mode={isLocked ? 'unlock' : pinModalMode}
        onSuccess={() => {
          sessionStorage.setItem('app_unlocked', 'true');
          setIsLocked(false);
          setIsPinModalOpen(false);
          checkPinStatus();
          showToast(
            isLocked
              ? 'ปลดล็อกเรียบร้อย'
              : pinModalMode === 'set'
              ? 'ตั้งรหัส PIN สำเร็จ'
              : 'ยกเลิกรหัส PIN สำเร็จ'
          );
        }}
        onCancel={() => {
          if (!isLocked) {
            setIsPinModalOpen(false);
          }
        }}
      />

      {/* Delete Entry Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingEntryId}
        title="ยืนยันการลบรายการ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้อย่างถาวร? การกระทำนี้ไม่สามารถยกเลิกได้"
        confirmLabel="ลบรายการ"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteEntry}
        onCancel={() => setDeletingEntryId(null)}
      />

      {/* Lazy Loaded Heavy Modals (Loaded only when opened) */}
      <Suspense fallback={null}>
        {shoppingModeEntry && (
          <ShoppingModeModal
            isOpen={!!shoppingModeEntry}
            entry={shoppingModeEntry}
            onClose={() => setShoppingModeEntry(null)}
            onToggleItem={handleToggleShoppingItem}
          />
        )}

        {isImportModalOpen && (
          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onSuccess={() => {
              loadCategories();
              setRefreshKey((k) => k + 1);
            }}
          />
        )}

        {isNotificationModalOpen && (
          <NotificationSettingsModal
            isOpen={isNotificationModalOpen}
            onClose={() => setIsNotificationModalOpen(false)}
          />
        )}

        {isTemplatesModalOpen && (
          <TemplatesModal
            isOpen={isTemplatesModalOpen}
            onClose={() => setIsTemplatesModalOpen(false)}
            onTemplateApplied={() => {
              loadCategories();
              setRefreshKey((k) => k + 1);
            }}
          />
        )}

        {isEncryptedBackupModalOpen && (
          <EncryptedBackupModal
            isOpen={isEncryptedBackupModalOpen}
            onClose={() => setIsEncryptedBackupModalOpen(false)}
            onRestoreSuccess={() => {
              loadCategories();
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
