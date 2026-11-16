import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Tìm kiếm cà phê, trà trái cây...',
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-stone-50 focus:bg-white text-stone-900 placeholder:text-stone-400 text-xs rounded-full border border-stone-200/80 focus:border-stone-400 focus:outline-none transition shadow-2xs"
        data-testid="search-input"
      />
      {value ? (
        <button
          onClick={onClear}
          className="w-5 h-5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center absolute right-3 top-2.5 transition"
          data-testid="search-clear-button"
          aria-label="Xóa từ khóa tìm kiếm"
        >
          <X className="w-3 h-3" />
        </button>
      ) : (
        <div className="w-4 h-4 rounded-full border border-stone-300 flex items-center justify-center absolute right-3.5 top-3 text-stone-300 pointer-events-none">
          <X className="w-2.5 h-2.5" />
        </div>
      )}
    </div>
  );
}
