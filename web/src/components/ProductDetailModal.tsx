import React, { useState, useEffect } from 'react';
import { Product, Size, Topping } from '../types';
import { X, Minus, Plus, Check } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGES, DrinkGraphicFallback } from './ProductCard';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (item: {
    product: Product;
    size: Size;
    sugar: string;
    toppings: Topping[];
    quantity: number;
    total: number;
  }) => void;
}

function formatVND(amount: number): string {
  return `${Number(amount).toLocaleString('vi-VN')}đ`;
}

const DEFAULT_SIZES: Size[] = [
  { sizeId: 'size-m', name: 'M (Vừa)', priceAdjustment: 0 },
  { sizeId: 'size-l', name: 'L (Lớn)', priceAdjustment: 8000 },
];

const SUGAR_LEVELS = ['0%', '30%', '50%', '70%', '100%'];

const DEFAULT_TOPPINGS: Topping[] = [
  { toppingId: 'top-1', name: 'Trân châu đen', price: 5000 },
  { toppingId: 'top-2', name: 'Pudding trứng', price: 8000 },
  { toppingId: 'top-3', name: 'Kem cheese', price: 10000 },
];

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) return null;

  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes.map((s) => ({
          ...s,
          name: s.name.includes('(') ? s.name : s.name === 'S' ? 'S (Nhỏ)' : s.name === 'M' ? 'M (Vừa)' : 'L (Lớn)',
        }))
      : DEFAULT_SIZES;

  const availableToppings =
    product.toppings && product.toppings.length > 0 ? product.toppings : DEFAULT_TOPPINGS;

  const [selectedSize, setSelectedSize] = useState<Size>(availableSizes[0]);
  const [selectedSugar, setSelectedSugar] = useState<string>('50%');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [imgError, setImgError] = useState(false);

  // Đóng modal khi bấm phím Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleTopping = (topping: Topping) => {
    if (selectedToppings.some((t) => t.toppingId === topping.toppingId)) {
      setSelectedToppings(selectedToppings.filter((t) => t.toppingId !== topping.toppingId));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const basePrice = Number(product.basePrice);
  const sizeExtra = Number(selectedSize?.priceAdjustment || 0);
  const toppingsExtra = selectedToppings.reduce((sum, t) => sum + Number(t.price), 0);
  const unitPrice = basePrice + sizeExtra + toppingsExtra;
  const totalPrice = unitPrice * quantity;

  const resolvedImageUrl = product.imageUrl || DEFAULT_PRODUCT_IMAGES[product.name] || null;

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({
        product,
        size: selectedSize,
        sugar: selectedSugar,
        toppings: selectedToppings,
        quantity,
        total: totalPrice,
      });
    } else {
      alert(`Đã thêm ${quantity}x "${product.name}" vào giỏ hàng!`);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-end justify-center select-none"
      data-testid="product-detail-modal"
    >
      {/* Vùng backdrop mờ đóng Modal */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        data-testid="modal-backdrop"
      />

      {/* Bottom Sheet Card */}
      <div
        className="w-full max-w-[420px] bg-white rounded-t-[32px] overflow-hidden shadow-2xl relative z-10 max-h-[92vh] flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle pill ở đỉnh modal */}
        <div className="pt-2.5 pb-1 flex justify-center bg-white">
          <div className="w-12 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* Khung cuộn nội dung */}
        <div className="overflow-y-auto px-5 pb-4 hide-scrollbar">
          {/* Ảnh lớn của món với nút X tròn trắng ở góc trên phải */}
          <div className="w-full h-48 rounded-2xl overflow-hidden mb-4 relative bg-stone-100 flex items-center justify-center">
            {resolvedImageUrl && !imgError ? (
              <img
                src={resolvedImageUrl}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <DrinkGraphicFallback name={product.name} />
            )}

            {/* Nút đóng hình tròn trắng chuẩn Figma */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-stone-800 shadow-md flex items-center justify-center absolute top-3 right-3 transition active:scale-95 z-10"
              data-testid="modal-close-top-button"
              aria-label="Đóng cửa sổ chi tiết"
            >
              <X className="w-4 h-4 text-stone-700" />
            </button>
          </div>

          {/* Tên món */}
          <h2 className="font-extrabold text-stone-900 text-xl tracking-tight leading-tight">
            {product.name}
          </h2>

          {/* Hàng giá tiền màu cam đất và nhãn "Còn hàng" */}
          <div className="flex items-center gap-2.5 mt-1.5 mb-4">
            <span className="text-[#C8651B] font-extrabold text-base">
              {formatVND(basePrice)}
            </span>
            <span className="bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Còn hàng
            </span>
          </div>

          {/* PHẦN 1: Chọn Size */}
          <div className="pt-4 border-t border-stone-150">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-bold text-stone-900 text-sm">Chọn Size</span>
              <span className="text-xs text-stone-400 font-medium">Bắt buộc · Chọn 1</span>
            </div>

            <div className="space-y-2">
              {availableSizes.map((size) => {
                const isSelected = selectedSize?.sizeId === size.sizeId;
                const extra = Number(size.priceAdjustment);
                return (
                  <div
                    key={size.sizeId}
                    onClick={() => setSelectedSize(size)}
                    className="flex items-center justify-between py-2 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio button tròn */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected ? 'border-[#C8651B]' : 'border-stone-300 group-hover:border-stone-400'
                        }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#C8651B]" />}
                      </div>
                      <span className="text-xs font-medium text-stone-800">
                        Size {size.name}
                      </span>
                    </div>

                    <span className="text-xs text-stone-500 font-medium">
                      {extra > 0 ? `+${formatVND(extra)}` : '0đ'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PHẦN 2: Chọn Mức Đường */}
          <div className="mt-4 pt-4 border-t border-stone-150">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-stone-900 text-sm">Chọn Mức Đường</span>
              <span className="text-xs text-stone-400 font-medium">Chọn 1</span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {SUGAR_LEVELS.map((level) => {
                const isSelected = selectedSugar === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedSugar(level)}
                    className={`py-2 rounded-full text-xs font-bold transition text-center ${
                      isSelected
                        ? 'bg-[#2A1E17] text-white shadow-sm'
                        : 'bg-white text-stone-700 border border-stone-200/90 hover:border-stone-300'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PHẦN 3: Topping thêm (tùy chọn) */}
          <div className="mt-4 pt-4 border-t border-stone-150">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-bold text-stone-900 text-sm">Topping thêm</span>
              <span className="text-xs text-stone-400 font-medium">Tùy chọn</span>
            </div>

            <div className="space-y-1.5">
              {availableToppings.map((top) => {
                const isSelected = selectedToppings.some((t) => t.toppingId === top.toppingId);
                return (
                  <label
                    key={top.toppingId}
                    onClick={() => toggleTopping(top)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer text-xs ${
                      isSelected ? 'border-amber-400 bg-amber-50/40' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected ? 'bg-[#C8651B] border-[#C8651B] text-white' : 'border-stone-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span className="text-stone-800 font-medium">{top.name}</span>
                    </span>
                    <span className="text-stone-500 font-semibold">
                      +{formatVND(Number(top.price))}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Thanh tác vụ dưới cùng cố định */}
        <div className="p-4 bg-white border-t border-stone-150 flex items-center gap-3">
          {/* Bộ chọn số lượng */}
          <div className="bg-stone-100 rounded-2xl px-3 py-2.5 flex items-center gap-3.5 text-stone-800 font-bold">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="text-stone-600 hover:text-stone-900 active:scale-90 transition p-0.5"
              aria-label="Giảm số lượng"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs min-w-[14px] text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="text-stone-600 hover:text-stone-900 active:scale-90 transition p-0.5"
              aria-label="Tăng số lượng"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Nút to màu cam đất Thêm vào giỏ hàng */}
          <button
            type="button"
            onClick={handleAddToCart}
            data-testid="add-to-cart-button"
            className="flex-1 bg-[#C8651B] hover:bg-[#B25714] active:scale-[0.98] text-white py-2 px-4 rounded-2xl shadow-md shadow-[#C8651B]/25 transition flex flex-col items-center justify-center"
          >
            <span className="text-[11px] font-semibold text-amber-100 leading-tight">
              Thêm vào giỏ hàng
            </span>
            <span className="text-sm font-extrabold leading-tight">
              {formatVND(totalPrice)}
            </span>
          </button>
        </div>

        {/* Thanh vạch Home Indicator của điện thoại */}
        <div className="pb-1.5 pt-0.5 bg-white flex justify-center">
          <div className="w-32 h-1 bg-stone-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}
