import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Coffee } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

// Bảng ánh xạ ảnh đồ uống chuẩn Unsplash
export const DEFAULT_PRODUCT_IMAGES: Record<string, string> = {
  'Trà Sữa Oolong Nướng': 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
  'Cà Phê Muối Hoàng Gia': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
  'Trà Đào Cam Sả Thượng Hạng': 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80',
  'Cà phê sữa đá': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
  'Americano đá': 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&q=80',
  'Americano': 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&q=80',
  'Cappuccino': 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&q=80',
  'Trà sữa trân châu': 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
  'Trà sữa matcha': 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&q=80',
  'Trà đào cam sả': 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80',
  'Trà vải lài': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80',
  'Chocolate đá xay': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80',
  'Matcha đá xay': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
  'Nước ép cam tươi': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80',
};

// Đồ họa minh họa đồ uống đẹp mắt khi offline hoặc mạng chặn CDN
export function DrinkGraphicFallback({ name }: { name: string }) {
  const isMatcha = name.toLowerCase().includes('matcha');
  const isBoba = name.toLowerCase().includes('trà sữa');
  const isFruit = name.toLowerCase().includes('trà đào') || name.toLowerCase().includes('trà vải') || name.toLowerCase().includes('nước ép');

  let bgGradient = 'from-amber-600 to-amber-900';
  let badgeText = '☕ Coffee';

  if (isMatcha) {
    bgGradient = 'from-emerald-500 to-teal-800';
    badgeText = '🍵 Matcha';
  } else if (isBoba) {
    bgGradient = 'from-amber-700 to-stone-800';
    badgeText = '🧋 Trà sữa';
  } else if (isFruit) {
    bgGradient = 'from-orange-500 to-rose-700';
    badgeText = '🍹 Trà & Nước ép';
  }

  return (
    <div className={`w-full h-full bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center text-white p-2 text-center select-none shadow-inner`}>
      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-1">
        <Coffee className="w-4 h-4 text-white" />
      </div>
      <span className="text-[10px] font-bold tracking-wider uppercase text-amber-100">{badgeText}</span>
    </div>
  );
}

function formatVND(amount: number): string {
  return `${Number(amount).toLocaleString('vi-VN')}đ`;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  // Lấy ảnh từ DB, nếu DB bị null thì lấy từ bảng ảnh dự phòng
  const resolvedImageUrl = product.imageUrl || DEFAULT_PRODUCT_IMAGES[product.name] || null;

  return (
    <div
      onClick={() => onSelect(product)}
      data-testid={`product-card-${product.productId}`}
      className="group bg-white rounded-2xl p-2.5 border border-stone-200/80 hover:border-amber-400 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Khung ảnh đại diện món */}
        <div className="w-full h-28 rounded-xl overflow-hidden mb-2 relative bg-stone-100 flex items-center justify-center">
          {resolvedImageUrl && !imgError ? (
            <img
              src={resolvedImageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <DrinkGraphicFallback name={product.name} />
          )}

          {/* Tag "Còn hàng" chuẩn màu xanh lá như bản thiết kế */}
          <span className="absolute top-1.5 left-1.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] text-[9px] px-2 py-0.5 rounded-full font-bold shadow-xs">
            Còn hàng
          </span>
        </div>

        {/* Tên món */}
        <h4 className="font-bold text-stone-900 text-xs line-clamp-1 leading-snug group-hover:text-amber-800 transition-colors">
          {product.name}
        </h4>

        {/* Mô tả ngắn */}
        {product.description && (
          <p className="text-[10px] text-stone-400 line-clamp-2 mt-0.5 leading-tight">
            {product.description}
          </p>
        )}
      </div>

      {/* Giá tiền và nút chọn nhanh dấu cộng màu cam đất */}
      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
        <span className="font-extrabold text-stone-900 text-xs">
          {formatVND(Number(product.basePrice))}
        </span>
        <button
          type="button"
          aria-label={`Chọn ${product.name}`}
          className="w-8 h-8 rounded-full bg-[#C8651B] text-white hover:bg-[#B25714] active:scale-95 flex items-center justify-center transition shadow-md"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
