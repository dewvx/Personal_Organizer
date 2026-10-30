import React, { useState, useEffect, useCallback } from 'react';
import { CategoryService } from './services/categoryService';
import { EntryService } from './services/entryService';
import { Category, Entry } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { EntryFormModal } from './components/entries/EntryFormModal';
import { ConfirmModal } from './components/common/ConfirmModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { AllListsPage } from './pages/AllListsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ArchivePage } from './pages/ArchivePage';

const MainApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'all' | 'categories' | 'favorites' | 'archive'>('dashboard');
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [defaultEntryCategoryId, setDefaultEntryCategoryId] = useState<number | undefined>(undefined);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  };

  const handleConfirmDeleteEntry = async () => {
    if (!deletingEntryId) return;
    try {
      setIsDeleting(true);
      await EntryService.delete(deletingEntryId);
      showToast('ลบรายการเรียบร้อย');
      setDeletingEntryId(null);
      loadCategories();
    } catch (err) {
      showToast('ไม่สามารถลบรายการได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
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
        />

        {/* Page Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onOpenNewEntry={() => handleOpenNewEntry()}
              onNavigateTab={(tab, catId) => handleSelectTab(tab, catId)}
              onEditEntry={handleEditEntry}
              onDeleteEntry={(id) => setDeletingEntryId(id)}
            />
          )}

          {currentTab === 'all' && (
            <AllListsPage
              categories={categories}
              searchQuery={searchQuery}
              initialCategoryId={activeCategoryId}
              onOpenNewEntry={handleOpenNewEntry}
              onEditEntry={handleEditEntry}
              onDeleteEntry={(id) => setDeletingEntryId(id)}
            />
          )}

          {currentTab === 'categories' && (
            <CategoriesPage
              categories={categories}
              onRefreshCategories={loadCategories}
              onViewCategoryEntries={(catId) => handleSelectTab('all', catId)}
            />
          )}

          {currentTab === 'favorites' && (
            <FavoritesPage
              onEditEntry={handleEditEntry}
              onDeleteEntry={(id) => setDeletingEntryId(id)}
              onNavigateAll={() => handleSelectTab('all')}
            />
          )}

          {currentTab === 'archive' && (
            <ArchivePage onNavigateAll={() => handleSelectTab('all')} />
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
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
