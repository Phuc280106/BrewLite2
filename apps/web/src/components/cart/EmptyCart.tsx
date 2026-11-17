import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const EmptyCart: React.FC = () => {
  return (
    <div
      data-testid="empty-cart"
      className="bg-white rounded-3xl border border-[#EDE7DF] shadow-sm p-8 sm:p-12 text-center max-w-lg mx-auto my-6"
    >
      <div className="w-20 h-20 rounded-full bg-[#F5ECE5] text-[#3D2615] flex items-center justify-center mx-auto mb-5">
        <ShoppingBag className="w-9 h-9" />
      </div>
      <h2 className="text-xl sm:text-2xl font-extrabold text-[#3D2615] mb-2">
        Giỏ hàng của bạn đang trống
      </h2>
      <p className="text-sm text-stone-500 mb-6 leading-relaxed">
        Hãy chọn cho mình một ly cà phê đậm đà hoặc trà trái cây mát lạnh từ thực đơn BrewLite nhé.
      </p>
      <Link
        href="/menu"
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-2xl bg-[#D97706] hover:bg-[#C26804] text-white font-bold text-sm transition shadow-md"
      >
        <span>Khám phá Menu ngay</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
