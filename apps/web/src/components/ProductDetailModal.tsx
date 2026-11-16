import React, { useState } from 'react';
import { Product, Size, Topping } from '@/types';
import { X, Plus, Minus } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState<Size | undefined>(
    product.sizes?.[0]
  );
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState(1);

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.toppingId === topping.toppingId)
        ? prev.filter((t) => t.toppingId !== topping.toppingId)
        : [...prev, topping]
    );
  };

  const totalPrice =
    (product.basePrice +
      (selectedSize?.priceAdjustment || 0) +
      selectedToppings.reduce((sum, t) => sum + t.price, 0)) *
    quantity;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header modal */}
        <div className="relative p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-lg line-clamp-1">
            {product.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {product.imageUrl && (
            <div className="relative w-full h-44 rounded-xl overflow-hidden bg-stone-100">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <p className="text-sm text-stone-600">
              {product.description || 'Hương vị thơm ngon, chế biến từ nguyên liệu tươi mới.'}
            </p>
            <p className="text-lg font-bold text-[#8A502F] mt-1">
              {product.basePrice.toLocaleString('vi-VN')} đ
            </p>
          </div>

          {/* Chọn Size */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2">
                Chọn kích cỡ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize?.sizeId === size.sizeId;
                  return (
                    <button
                      key={size.sizeId}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition ${
                        isSelected
                          ? 'border-[#8A502F] bg-[#F5ECE5] text-[#8A502F] font-bold shadow-sm'
                          : 'border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div>{size.name}</div>
                      <div className="text-[10px] text-stone-500">
                        {size.priceAdjustment > 0
                          ? `+${size.priceAdjustment.toLocaleString('vi-VN')}đ`
                          : 'Tiêu chuẩn'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chọn Topping */}
          {product.toppings && product.toppings.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider block mb-2">
                Topping thêm
              </label>
              <div className="space-y-1.5">
                {product.toppings.map((topping) => {
                  const isSelected = selectedToppings.some(
                    (t) => t.toppingId === topping.toppingId
                  );
                  return (
                    <button
                      key={topping.toppingId}
                      type="button"
                      onClick={() => toggleTopping(topping)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs flex justify-between items-center transition ${
                        isSelected
                          ? 'border-[#8A502F] bg-[#F5ECE5] text-[#8A502F] font-semibold'
                          : 'border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <span>{topping.name}</span>
                      <span>+{topping.price.toLocaleString('vi-VN')} đ</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Số lượng */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Số lượng
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-stone-900 text-sm w-4 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Nút thêm vào giỏ */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3 bg-[#8A502F] hover:bg-[#733F22] text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-between px-4"
          >
            <span>Thêm vào giỏ</span>
            <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
