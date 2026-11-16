import React from 'react';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 py-2 hide-scrollbar"
      data-testid="category-filter"
    >
      {/* Nút "Tất cả" mặc định */}
      <button
        onClick={() => onSelectCategory(null)}
        data-testid="category-all-tab"
        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
          selectedCategoryId === null
            ? 'bg-[#2A1E17] text-white shadow-sm'
            : 'bg-white text-stone-700 border border-stone-200/90 hover:bg-stone-50'
        }`}
      >
        Tất cả
      </button>

      {/* Danh sách các danh mục */}
      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.categoryId;
        return (
          <button
            key={cat.categoryId}
            onClick={() => onSelectCategory(cat.categoryId)}
            data-testid={`category-tab-${cat.categoryId}`}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              isSelected
                ? 'bg-[#2A1E17] text-white shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200/90 hover:bg-stone-50'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}
