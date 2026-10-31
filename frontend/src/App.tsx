import React, { useState, useEffect, useCallback } from 'react';
import { CategoryService } from './services/categoryService';
import { EntryService } from './services/entryService';
import { Category, Entry } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { EntryFormModal } from './components/entries/EntryFormModal';
import { ConfirmModal } from './components/common/ConfirmModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { AllListsPage } from './pages/AllListsPage';
import { CalendarViewPage } from './pages/CalendarViewPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ArchivePage } from './pages/ArchivePage';
import { ShoppingModeModal } from './components/entries/ShoppingModeModal';
import { PinLockModal } from './components/common/PinLockModal';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'all' | 'calendar' | 'categories' | 'favorites' | 'archive'>('dashboard');
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modals & Mobile Focus States
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [defaultEntryCategoryId, setDefaultEntryCategoryId] = useState<number | undefined>(undefined);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shoppingModeEntry, setShoppingModeEntry] = useState<Entry | null>(null);

  // PIN Lock Security States
  const [isPinSet, setIsPinSet] = useState<boolean>(() => Boolean(localStorage.getItem('app_pin_code')));
  const [isLocked, setIsLocked] = useState<boolean>(() => Boolean(localStorage.getItem('app_pin_code')));
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'unlock' | 'set' | 'disable'>('unlock');

  const { showToast } = useToast();

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
  const handleOpenNewEntry = (categoryPresetId?: number) => {
    setEditingEntry(null);
    setDefaultEntryCategoryId(categoryPresetId || activeCategoryId);
    setIsEntryModalOpen(true);
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleEntrySubmit = async (data: Partial<Entry>) => {
    if (editingEntry) {
      await EntryService.update(editingEntry.id, data);
      showToast('อัปเดตรายการเรียบร้อย');
    } else {
      await EntryService.create(data);
      showToast('สร้างรายการใหม่สำเร็จ');
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
      // รีโหลดหน้าเว็บให้อัตโนมัติทันทีตามความต้องการของผู้ใช้
      window.location.reload();
    } catch (err) {
      showToast('ไม่สามารถลบรายการได้', 'error');
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
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
          onLockApp={() => {
            setIsLocked(true);
            setPinModalMode('unlock');
            setIsPinModalOpen(true);
          }}
          onConfigurePin={(mode) => {
            setPinModalMode(mode);
            setIsPinModalOpen(true);
          }}
          isPinSet={isPinSet}
        />

        {/* Page Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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

          {currentTab === 'calendar' && (
            <CalendarViewPage
              key={`calendar_${refreshKey}`}
              onOpenNewEntry={() => handleOpenNewEntry()}
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
        }}
        onSubmit={handleEntrySubmit}
        initialData={editingEntry}
        categories={categories}
        defaultCategoryId={defaultEntryCategoryId}
      />

      {/* Shopping Focus Mode Modal */}
      {shoppingModeEntry && (
        <ShoppingModeModal
          isOpen={!!shoppingModeEntry}
          entry={shoppingModeEntry}
          onClose={() => setShoppingModeEntry(null)}
          onToggleItem={handleToggleShoppingItem}
        />
      )}

      {/* 4-digit PIN Passcode Lock Screen Modal */}
      <PinLockModal
        isOpen={isLocked || isPinModalOpen}
        mode={isLocked ? 'unlock' : pinModalMode}
        onSuccess={() => {
          setIsLocked(false);
          setIsPinModalOpen(false);
          setIsPinSet(Boolean(localStorage.getItem('app_pin_code')));
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
