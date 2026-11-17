import React, { useState } from 'react';
import { CartItem } from '@/types/cart';
import { calculateItemLineTotal, formatVND } from '@/lib/cartPricing';
import { DEFAULT_PRODUCT_IMAGES, DrinkGraphicFallback } from '@/components/ProductCard';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemRowProps {
  item: CartItem;
  onIncrease: (itemId: string) => void;
  onDecrease: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const [imgError, setImgError] = useState(false);
  const resolvedImageUrl =
    item.imageUrl || DEFAULT_PRODUCT_IMAGES[item.productName] || null;
  const lineTotal = calculateItemLineTotal(item);

  return (
    <div
      data-testid={`cart-item-${item.id}`}
      className="bg-white rounded-2xl border border-[#EDE7DF] p-4 sm:p-5 shadow-2xs flex gap-3.5 sm:gap-4 items-start"
    >
      {/* Ảnh món */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-100 shrink-0">
        {resolvedImageUrl && !imgError ? (
          <img
            src={resolvedImageUrl}
            alt={item.productName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <DrinkGraphicFallback name={item.productName} />
        )}
      </div>

      {/* Thông tin & Tùy biến */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-[#3D2615] text-sm sm:text-base leading-snug truncate">
              {item.productName}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Đơn giá: {formatVND(item.unitPrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item)}
            aria-label={`Xóa ${item.productName}`}
            className="min-w-[44px] min-h-[44px] -mt-2 -mr-2 rounded-xl flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chi tiết Size / Đường / Đá / Topping */}
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-stone-600">
          <span className="bg-[#FBF9F5] border border-[#EDE7DF] px-2 py-0.5 rounded-lg font-medium">
            {item.size.name}
          </span>
          <span className="bg-[#FBF9F5] border border-[#EDE7DF] px-2 py-0.5 rounded-lg">
            Đường {item.sugar}
          </span>
          <span className="bg-[#FBF9F5] border border-[#EDE7DF] px-2 py-0.5 rounded-lg">
            {item.ice}
          </span>
          {item.toppings.map((topping) => (
            <span
              key={topping.toppingId}
              className="bg-[#FFF8ED] border border-amber-200 text-[#9A4E04] px-2 py-0.5 rounded-lg font-medium"
            >
              +{topping.name} ({formatVND(topping.price)})
            </span>
          ))}
        </div>

        {item.note && (
          <p className="mt-2 text-xs text-stone-500 italic bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-100">
            Ghi chú: {item.note}
          </p>
        )}

        {/* Bộ điều chỉnh số lượng & Thành tiền */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="inline-flex items-center bg-[#FBF9F5] border border-[#EDE7DF] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => onDecrease(item)}
              aria-label={`Giảm số lượng ${item.productName}`}
              className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-200/70 transition cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span
              data-testid={`cart-item-qty-${item.id}`}
              className="w-9 text-center font-bold text-sm text-[#3D2615]"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onIncrease(item.id)}
              aria-label={`Tăng số lượng ${item.productName}`}
              className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-stone-700 hover:bg-stone-200/70 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <span
            data-testid={`cart-item-total-${item.id}`}
            className="font-extrabold text-[#3D2615] text-base sm:text-lg"
          >
            {formatVND(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};
