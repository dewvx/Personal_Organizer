import React, { useState } from 'react';
import { Plus, FolderTree } from 'lucide-react';
import { CategoryService } from '../services/categoryService';
import { Category } from '../types';
import { useToast } from '../context/ToastContext';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryFormModal } from '../components/categories/CategoryFormModal';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { EmptyState } from '../components/common/EmptyState';

interface CategoriesPageProps {
  categories: Category[];
  onRefreshCategories: () => void;
  onViewCategoryEntries: (categoryId: number) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onRefreshCategories,
  onViewCategoryEntries,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const handleCreateOrUpdate = async (data: Partial<Category>) => {
    try {
      if (editingCategory) {
        await CategoryService.update(editingCategory.id, data);
        showToast('แก้ไขหมวดหมู่สำเร็จ');
      } else {
        await CategoryService.create(data as any);
        showToast('สร้างหมวดหมู่ใหม่สำเร็จ');
      }
      onRefreshCategories();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่', 'error');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await CategoryService.delete(deletingId);
      showToast('ลบหมวดหมู่เรียบร้อย');
      setDeletingId(null);
      onRefreshCategories();
    } catch (err: any) {
      showToast('ไม่สามารถลบหมวดหมู่ได้', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">จัดการหมวดหมู่ (Categories)</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            สร้างและปรับแต่งประเภทข้อมูลของคุณได้อย่างอิสระ พร้อมกำหนดสีและไอคอน
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          size="md"
          leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
        >
          สร้างหมวดหมู่ใหม่
        </Button>
      </div>

      {/* Grid of Categories */}
      {categories.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="w-7 h-7" />}
          title="ยังไม่มีหมวดหมู่"
          description="เริ่มต้นสร้างหมวดหมู่แรกของคุณ เช่น งาน, ช้อปปิ้ง หรือเป้าหมายส่วนตัว"
          actionLabel="สร้างหมวดหมู่"
          onAction={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={(category) => {
                setEditingCategory(category);
                setIsFormOpen(true);
              }}
              onDelete={(id) => setDeletingId(id)}
              onViewEntries={onViewCategoryEntries}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingCategory}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="ยืนยันการลบหมวดหมู่"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้? รายการข้อมูลที่อยู่ใต้หมวดหมู่นี้จะยังคงอยู่ แต่จะถูกปลดหมวดหมู่ออกเป็น (ไม่มีหมวดหมู่)"
        confirmLabel="ลบหมวดหมู่"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
