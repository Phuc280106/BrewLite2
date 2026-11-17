import React, { useEffect, useState } from 'react';
import { Product, Size, Topping } from '@/types';
import { AddToCartInput } from '@/types/cart';
import { calculateItemUnitPrice, formatVND, toNumeric } from '@/lib/cartPricing';
import { X, Plus, Minus, Check } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGES, DrinkGraphicFallback } from './ProductCard';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart?: (item: AddToCartInput) => void;
}

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const CLEAN_URL = RAW_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL.endsWith('/api/v1') ? CLEAN_URL : `${CLEAN_URL}/api/v1`;

const SUGAR_OPTIONS = ['0%', '30%', '50%', '70%', '100%'];
const ICE_OPTIONS = ['Nóng', 'Không đá', '50% đá', '100% đá'];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [detailProduct, setDetailProduct] = useState<Product>(product);
  const [selectedSize, setSelectedSize] = useState<Size | undefined>(
    product.sizes?.[0]
  );
  const [selectedSugar, setSelectedSugar] = useState<string>('50%');
  const [selectedIce, setSelectedIce] = useState<string>('50% đá');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [note, setNote] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [imgError, setImgError] = useState(false);

  // Nạp chi tiết size và topping đầy đủ từ API nếu danh sách menu chưa đính kèm
  useEffect(() => {
    setDetailProduct(product);
    setSelectedSize(product.sizes?.[0]);
    setSelectedToppings([]);

    if (product.sizes && product.sizes.length > 0 && product.toppings) {
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/products/${product.productId}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Product | null) => {
        if (cancelled || !data) return;
        setDetailProduct(data);
        setSelectedSize((prev) => prev ?? data.sizes?.[0]);
      })
      .catch(() => {
        // Giữ dữ liệu hiện tại nếu backend không khả dụng
      });

    return () => {
      cancelled = true;
    };
  }, [product]);

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.toppingId === topping.toppingId)
        ? prev.filter((t) => t.toppingId !== topping.toppingId)
        : [...prev, topping]
    );
  };

  const unitPrice = calculateItemUnitPrice(
    detailProduct.basePrice,
    selectedSize?.priceAdjustment ?? 0,
    selectedToppings,
  );
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart({
        product: detailProduct,
        size: selectedSize,
        sugar: selectedSugar,
        ice: selectedIce,
        toppings: selectedToppings,
        note,
        quantity,
      });
    }
    onClose();
  };

  const resolvedImageUrl =
    detailProduct.imageUrl || DEFAULT_PRODUCT_IMAGES[detailProduct.name] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgba(31,20,13,0.45)] backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-md sm:max-w-3xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[85vh] flex flex-col sm:flex-row overflow-hidden shadow-2xl relative border border-stone-100"
      >
        
        {/* Nút đóng modal góc trên */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-stone-700 flex items-center justify-center transition backdrop-blur-xs"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cột trái (Desktop): Ảnh lớn & Thông tin tổng quan */}
        <div className="w-full sm:w-[320px] bg-[#FBF9F5] p-5 sm:p-6 flex flex-col justify-between shrink-0 border-b sm:border-b-0 sm:border-r border-[#EDE7DF]">
          <div>
            <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
              {resolvedImageUrl && !imgError ? (
                <img
                  src={resolvedImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <DrinkGraphicFallback name={product.name} />
              )}
              <span className="absolute top-2.5 left-2.5 bg-[#EDFAF2] text-[#147D56] text-xs px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                Còn hàng
              </span>
            </div>

            <h3 className="font-bold text-stone-900 text-lg sm:text-xl leading-snug">
              {detailProduct.name}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 line-clamp-3">
              {detailProduct.description || 'Hương thơm nguyên bản, vị béo ngọt thanh mát đặc trưng của BrewLite.'}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-200/60 mt-3 sm:mt-0">
            <span className="text-xs text-stone-400 block font-medium">Giá tiêu chuẩn</span>
            <span className="text-xl font-extrabold text-[#3D2615]">
              {formatVND(toNumeric(detailProduct.basePrice))}
            </span>
          </div>
        </div>

        {/* Cột phải (Desktop): Form tùy biến cuộn */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* 1. Chọn Size (Bắt buộc) */}
            {detailProduct.sizes && detailProduct.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-[#3D2615] uppercase tracking-wide">
                    Chọn kích cỡ
                  </span>
                  <span className="text-[11px] text-[#D97706] font-semibold">Bắt buộc • Chọn 1</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {detailProduct.sizes.map((size) => {
                    const isSelected = selectedSize?.sizeId === size.sizeId;
                    const sizeAdj = toNumeric(size.priceAdjustment);
                    return (
                      <button
                        key={size.sizeId}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                          isSelected
                            ? 'border-[#3D2615] bg-[#3D2615] text-white shadow-xs'
                            : 'border-stone-200 text-stone-700 hover:border-stone-400 bg-white'
                        }`}
                      >
                        <span className="font-semibold">{size.name}</span>
                        <span className={isSelected ? 'text-amber-100' : 'text-stone-500'}>
                          {sizeAdj > 0
                            ? `+${formatVND(sizeAdj)}`
                            : '0đ'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Chọn Mức Đường */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#3D2615] uppercase tracking-wide">
                  Chọn mức đường
                </span>
                <span className="text-[11px] text-stone-400 font-medium">Chọn 1</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {SUGAR_OPTIONS.map((sugar) => {
                  const isSelected = selectedSugar === sugar;
                  return (
                    <button
                      key={sugar}
                      type="button"
                      onClick={() => setSelectedSugar(sugar)}
                      className={`py-2 rounded-xl text-xs font-semibold transition text-center ${
                        isSelected
                          ? 'bg-[#3D2615] text-white shadow-xs'
                          : 'bg-white border border-[#EDE7DF] text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {sugar}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Chọn Mức Đá */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#3D2615] uppercase tracking-wide">
                  Chọn mức đá
                </span>
                <span className="text-[11px] text-stone-400 font-medium">Chọn 1</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {ICE_OPTIONS.map((ice) => {
                  const isSelected = selectedIce === ice;
                  return (
                    <button
                      key={ice}
                      type="button"
                      onClick={() => setSelectedIce(ice)}
                      className={`py-2 rounded-xl text-xs font-semibold transition text-center ${
                        isSelected
                          ? 'bg-[#3D2615] text-white shadow-xs'
                          : 'bg-white border border-[#EDE7DF] text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {ice}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Chọn Topping thêm */}
            {detailProduct.toppings && detailProduct.toppings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#3D2615] uppercase tracking-wide">
                    Topping thêm
                  </span>
                  <span className="text-[11px] text-stone-400 font-medium">Tùy chọn</span>
                </div>
                <div className="space-y-2">
                  {detailProduct.toppings.map((topping) => {
                    const isSelected = selectedToppings.some(
                      (t) => t.toppingId === topping.toppingId
                    );
                    return (
                      <button
                        key={topping.toppingId}
                        type="button"
                        onClick={() => toggleTopping(topping)}
                        className={`w-full py-2.5 px-3 rounded-xl border text-xs flex items-center justify-between transition ${
                          isSelected
                            ? 'border-[#D97706] bg-[#FFF8ED] text-stone-900 font-medium'
                            : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                              isSelected
                                ? 'bg-[#3D2615] border-[#3D2615] text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{topping.name}</span>
                        </div>
                        <span className="font-semibold text-stone-800">
                          +{formatVND(toNumeric(topping.price))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Ghi chú cho barista */}
            <div>
              <span className="text-xs font-bold text-[#3D2615] uppercase tracking-wide block mb-1.5">
                Ghi chú cho Barista
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Ghi chú thêm cho quán (ít ngọt, nhiều đá...)"
                className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:border-[#3D2615] focus:outline-none placeholder:text-stone-400 resize-none"
              />
            </div>
          </div>

          {/* Sticky Modal Bottom Actions */}
          <div className="p-4 sm:p-5 border-t border-[#EDE7DF] bg-white flex items-center gap-3 shrink-0">
            {/* Bộ tăng giảm số lượng */}
            <div className="flex items-center justify-between bg-[#FBF9F5] border border-[#EDE7DF] rounded-xl px-2 py-1.5 w-28 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-200 transition disabled:opacity-30"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-stone-900 text-sm">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-200 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Nút Thêm vào giỏ hàng */}
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-3 bg-[#D97706] hover:bg-[#C26804] text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <span>Thêm vào giỏ hàng</span>
              <span>•</span>
              <span>{formatVND(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
