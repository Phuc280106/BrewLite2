import React from 'react';
import { AlertCircle, RotateCcw, SearchX } from 'lucide-react';

/**
 * 1. Skeleton Loading State
 * Activity Diagram: partition Hệ thống -> Hiển thị trạng thái đang tải (Skeleton)
 */
export function SkeletonState() {
  return (
    <div className="p-4 space-y-4 animate-pulse" data-testid="skeleton">
      {/* Category Pills Skeleton */}
      <div className="flex gap-2 overflow-hidden py-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 bg-stone-200 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Product Cards 2-column Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-2.5 border border-stone-200/80 space-y-2">
            <div className="w-full h-28 bg-stone-200 rounded-xl" />
            <div className="h-4 bg-stone-200 rounded w-3/4" />
            <div className="h-3 bg-stone-200 rounded w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-6 w-6 bg-stone-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. Empty State
 * Activity Diagram: [Không có món phù hợp] -> Hiển thị trạng thái danh sách trống (Empty)
 * usecase-menu-spec.md: Ngoại lệ E1
 */
interface EmptyStateProps {
  message?: string;
  onReset: () => void;
}

export function EmptyState({
  message = 'Không tìm thấy đồ uống phù hợp',
  onReset,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center my-6"
      data-testid="empty-state"
    >
      <div className="w-14 h-14 rounded-full bg-amber-50 text-coffee-700 flex items-center justify-center mb-2 shadow-sm">
        <SearchX className="w-7 h-7 text-amber-700" />
      </div>
      <h4 className="font-bold text-stone-800 text-sm">{message}</h4>
      <p className="text-xs text-stone-500 mt-0.5 max-w-xs">
        Vui lòng thử tìm với từ khóa khác hoặc xóa bộ lọc danh mục hiện tại.
      </p>
      <button
        onClick={onReset}
        className="mt-3 px-4 py-1.5 text-xs font-semibold bg-amber-100 text-amber-900 rounded-full hover:bg-amber-200 transition flex items-center gap-1.5"
        data-testid="reset-filter-btn"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Xóa bộ lọc
      </button>
    </div>
  );
}

/**
 * 3. Error State
 * Activity Diagram: [Lỗi hệ thống] -> Hiển thị thông báo lỗi (Error) kèm nút "Thử lại"
 * usecase-menu-spec.md: Ngoại lệ E2
 */
interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = 'Không thể tải danh sách thực đơn',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center my-6"
      data-testid="error-state"
    >
      <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2 shadow-sm">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h4 className="font-bold text-stone-800 text-sm">Đã có lỗi xảy ra</h4>
      <p className="text-xs text-stone-500 mt-0.5 max-w-xs mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2 text-xs font-semibold text-white bg-coffee-700 hover:bg-coffee-800 rounded-full shadow-md transition flex items-center gap-2"
        data-testid="retry-button"
      >
        <RotateCcw className="w-4 h-4" />
        Thử lại
      </button>
    </div>
  );
}
