import React from 'react';
import { Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Category } from '../../types';
import { renderCategoryIcon } from '../../utils/categoryIcons';
import { Card } from '../common/Card';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onViewEntries: (id: number) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onViewEntries,
}) => {
  return (
    <Card className="flex flex-col justify-between hover:border-slate-300 transition-all p-4 sm:p-5">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: `${category.color}18`,
              color: category.color,
            }}
          >
            {renderCategoryIcon(category.icon, 'w-6 h-6')}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(category)}
              aria-label="แก้ไขหมวดหมู่"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(category.id)}
              aria-label="ลบหมวดหมู่"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900">{category.name}</h3>
        {category.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600">
          {category.entry_count || 0} รายการ
        </span>

        <button
          onClick={() => onViewEntries(category.id)}
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <span>ดูรายการ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};
