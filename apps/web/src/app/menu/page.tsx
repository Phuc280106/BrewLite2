'use client';

// ============================================================
// ManHinhMenu (Page Component) - /menu
// Ánh xạ chính xác từ bản thiết kế Figma Mobile-first:
//   - Tỷ lệ khung hình điện thoại PWA 420px
//   - Header: Logo BrewLite, SGU Central Hub dropdown, 120 pts badge
//   - SearchBar: Tìm kiếm cà phê, trà trái cây...
//   - Promo banner: Món mới tuần này (Trà Đào Cam Sả Thượng Hạng, Tích x2 điểm thưởng)
//   - Indicator 3 chấm phân trang
//   - Tiêu đề "Bạn uống gì hôm nay? Pha mới, trọn vị."
//   - Category tabs lọc thời gian thực (Tất cả, Cà phê pha phin, Trà sữa, Trà trái cây)
//   - Lưới thẻ sản phẩm 2 cột (Trà Sữa Oolong Nướng, Cà Phê Muối Hoàng Gia)
//   - Modal xem chi tiết món & tùy biến (Size, Mức đường, Topping, Số lượng)
//   - Bottom Navigation Bar (Menu, Đơn hàng, Tích điểm, Tài khoản)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Category, Product, Size, Topping } from '@/types';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetailModal } from '@/components/ProductDetailModal';
import { SkeletonState, EmptyState, ErrorState } from '@/components/UIStates';
import {
  Coffee,
  ChevronDown,
  Coins,
  ReceiptText,
  Gift,
  User,
  Signal,
  Wifi,
  Battery,
} from 'lucide-react';

// Dữ liệu danh mục mẫu chuẩn theo thiết kế
const FALLBACK_CATEGORIES: Category[] = [
  { categoryId: 'ca-phe-phin', name: 'Cà phê pha phin', description: 'Cà phê pha phin truyền thống và máy' },
  { categoryId: 'tra-sua', name: 'Trà sữa', description: 'Trà sữa đậm vị kem béo' },
  { categoryId: 'tra-trai-cay', name: 'Trà trái cây', description: 'Trà hoa quả tươi mát thanh nhiệt' },
  { categoryId: 'da-xay', name: 'Đá xay', description: 'Thức uống đá xay nhuyễn mát lạnh' },
];

// Dữ liệu 10 món nước mẫu chuẩn của Phước (khớp 100% hình ảnh trong Figma)
const FALLBACK_PRODUCTS: Product[] = [
  {
    productId: '1',
    name: 'Trà Sữa Oolong Nướng',
    description: 'Hương trà nướng, béo mịn',
    basePrice: 38000,
    categoryId: 'tra-sua',
    category: { categoryId: 'tra-sua', name: 'Trà sữa' },
    imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
    sizes: [
      { sizeId: 'size-m', name: 'M (Vừa)', priceAdjustment: 0 },
      { sizeId: 'size-l', name: 'L (Lớn)', priceAdjustment: 8000 },
    ],
    toppings: [
      { toppingId: 'top-1', name: 'Trân châu đen', price: 5000 },
      { toppingId: 'top-2', name: 'Pudding trứng', price: 8000 },
      { toppingId: 'top-3', name: 'Kem cheese', price: 10000 },
    ],
  },
  {
    productId: '2',
    name: 'Cà Phê Muối Hoàng Gia',
    description: 'Vị béo ngậy, đậm đà',
    basePrice: 35000,
    categoryId: 'ca-phe-phin',
    category: { categoryId: 'ca-phe-phin', name: 'Cà phê pha phin' },
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
    sizes: [
      { sizeId: 'size-m', name: 'M (Vừa)', priceAdjustment: 0 },
      { sizeId: 'size-l', name: 'L (Lớn)', priceAdjustment: 8000 },
    ],
    toppings: [
      { toppingId: 'top-1', name: 'Kem béo muối', price: 8000 },
      { toppingId: 'top-2', name: 'Thạch cà phê', price: 6000 },
    ],
  },
  {
    productId: '3',
    name: 'Trà Đào Cam Sả Thượng Hạng',
    description: 'Hương sả thanh khiết kết hợp đào giòn ngọt',
    basePrice: 39000,
    categoryId: 'tra-trai-cay',
    category: { categoryId: 'tra-trai-cay', name: 'Trà trái cây' },
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80',
    sizes: [
      { sizeId: 'size-m', name: 'M (Vừa)', priceAdjustment: 0 },
      { sizeId: 'size-l', name: 'L (Lớn)', priceAdjustment: 8000 },
    ],
    toppings: [
      { toppingId: 'top-1', name: 'Đào ngâm miếng', price: 8000 },
      { toppingId: 'top-2', name: 'Hạt chia', price: 5000 },
    ],
  },
  {
    productId: '4',
    name: 'Cà phê sữa đá',
    description: 'Đậm đà hương vị truyền thống phin nguyên chất',
    basePrice: 29000,
    categoryId: 'ca-phe-phin',
    category: { categoryId: 'ca-phe-phin', name: 'Cà phê pha phin' },
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
  },
  {
    productId: '5',
    name: 'Americano đá',
    description: 'Espresso nguyên chất pha loãng mát lạnh thanh nhẹ',
    basePrice: 35000,
    categoryId: 'ca-phe-phin',
    category: { categoryId: 'ca-phe-phin', name: 'Cà phê pha phin' },
    imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&q=80',
  },
  {
    productId: '6',
    name: 'Trà sữa trân châu',
    description: 'Trà đen thơm ngát cùng trân châu dai giòn thủ công',
    basePrice: 35000,
    categoryId: 'tra-sua',
    category: { categoryId: 'tra-sua', name: 'Trà sữa' },
    imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
  },
  {
    productId: '7',
    name: 'Trà sữa matcha',
    description: 'Bột trà xanh Nhật Bản thanh khiết kết hợp sữa',
    basePrice: 42000,
    categoryId: 'tra-sua',
    category: { categoryId: 'tra-sua', name: 'Trà sữa' },
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&q=80',
  },
  {
    productId: '8',
    name: 'Trà vải lài',
    description: 'Trà hoa lài ướp hương trái vải tươi mọng nước',
    basePrice: 35000,
    categoryId: 'tra-trai-cay',
    category: { categoryId: 'tra-trai-cay', name: 'Trà trái cây' },
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80',
  },
  {
    productId: '9',
    name: 'Chocolate đá xay',
    description: 'Chocolate Bỉ đậm đặc xay cùng whipped cream',
    basePrice: 49000,
    categoryId: 'da-xay',
    category: { categoryId: 'da-xay', name: 'Đá xay' },
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80',
  },
  {
    productId: '10',
    name: 'Matcha đá xay',
    description: 'Đá xay matcha thơm béo sảng khoái bùng nổ',
    basePrice: 49000,
    categoryId: 'da-xay',
    category: { categoryId: 'da-xay', name: 'Đá xay' },
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);

  /**
   * Gọi API Backend hoặc sử dụng dữ liệu mẫu nếu API chưa khởi động
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Thử gọi API danh mục
      const catRes = await fetch(`${API_BASE}/products/categories`, { cache: 'no-store' });
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData);
        }
      }

      // 2. Thử gọi API danh sách sản phẩm theo query
      const params = new URLSearchParams();
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
      if (searchKeyword.trim()) params.append('search', searchKeyword.trim());

      const prodRes = await fetch(`${API_BASE}/products?${params.toString()}`, { cache: 'no-store' });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData) && prodData.length > 0) {
          setProducts(prodData);
          return;
        }
      }
      throw new Error('API Backend chưa có dữ liệu');
    } catch {
      // Fallback: Lọc từ danh sách món mẫu theo đúng yêu cầu nghiệp vụ
      let filtered = [...FALLBACK_PRODUCTS];
      if (selectedCategoryId) {
        filtered = filtered.filter((p) => p.categoryId === selectedCategoryId);
      }
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)),
        );
      }
      setProducts(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategoryId, searchKeyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleResetFilters = () => {
    setSelectedCategoryId(null);
    setSearchKeyword('');
  };

  const handleAddToCart = () => {
    setCartCount((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Dynamic Island / Status Bar chuẩn Mobile Figma */}
      <div className="bg-white pt-3 px-6 pb-2 flex justify-between items-center text-xs font-semibold text-stone-900 z-30 shrink-0">
        <span>9:41</span>
        <div className="w-24 h-4 bg-stone-900 rounded-full mx-auto" />
        <div className="flex items-center gap-1.5 text-stone-800">
          <Signal className="w-3.5 h-3.5" />
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {/* 2. Header thương hiệu BrewLite & Địa điểm Hub */}
      <header className="bg-white px-5 pt-1 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          {/* Logo & Dropdown Địa điểm */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#3B2314] text-white flex items-center justify-center shadow-sm">
              <Coffee className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h1 className="font-extrabold text-stone-900 text-lg leading-tight tracking-tight">
                BrewLite
              </h1>
              <div className="flex items-center gap-1 text-xs text-stone-500 font-medium cursor-pointer hover:text-stone-700">
                <span>SGU Central Hub</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </div>
            </div>
          </div>

          {/* Viên thuốc tích điểm: 120 pts */}
          <div className="bg-[#EEF7F2] text-[#2D7A4D] font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[#D5EFE0] shadow-xs">
            <Coins className="w-3.5 h-3.5 text-[#2D7A4D]" />
            <span>120 pts</span>
          </div>
        </div>

        {/* Ô tìm kiếm SearchBar */}
        <SearchBar
          value={searchKeyword}
          onChange={setSearchKeyword}
          onClear={() => setSearchKeyword('')}
          placeholder="Tìm kiếm cà phê, trà trái cây..."
        />
      </header>

      {/* 3. Vùng cuộn nội dung chính */}
      <main className="flex-1 overflow-y-auto hide-scrollbar pb-24">
        {/* Banner món mới tuần này (Trà Đào Cam Sả Thượng Hạng) */}
        <div className="px-5 pt-1 pb-3">
          <div className="bg-gradient-to-r from-[#2B1810] via-[#3B2215] to-[#25150D] rounded-3xl p-4 text-white relative overflow-hidden shadow-md flex items-center justify-between">
            <div className="relative z-10 max-w-[62%]">
              <span className="text-[11px] text-stone-300 font-medium block mb-1">
                Món mới tuần này
              </span>
              <h2 className="font-extrabold text-base leading-snug text-white mb-3">
                Trà Đào Cam Sả<br />Thượng Hạng
              </h2>
              <span className="bg-[#54301A] text-[#F5D59A] text-[11px] font-semibold px-3 py-1 rounded-full inline-block shadow-sm">
                Tích x2 điểm thưởng
              </span>
            </div>

            {/* Ảnh ly trà đào cam sả thực tế */}
            <div className="relative z-10 w-28 h-28 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&q=80"
                alt="Trà Đào Cam Sả Thượng Hạng"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Dấu 3 chấm phân trang dưới Banner */}
          <div className="flex justify-center items-center gap-1.5 mt-2.5">
            <span className="w-5 h-1.5 rounded-full bg-[#C8651B]" />
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          </div>
        </div>

        {/* Tiêu đề "Bạn uống gì hôm nay?" */}
        <div className="px-5 pt-2 pb-2">
          <h3 className="font-extrabold text-stone-900 text-base leading-tight">
            Bạn uống gì hôm nay?
          </h3>
          <p className="text-xs text-stone-400 mt-0.5 font-normal">
            Pha mới, trọn vị.
          </p>
        </div>

        {/* Thanh chọn Danh mục cuộn ngang (Category Tabs) */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 py-1">
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        {/* 4. Render danh sách sản phẩm theo trạng thái */}
        {isLoading && <SkeletonState />}

        {!isLoading && errorMessage && (
          <ErrorState message={errorMessage} onRetry={loadData} />
        )}

        {!isLoading && !errorMessage && products.length === 0 && (
          <EmptyState
            message="Không tìm thấy đồ uống phù hợp"
            onReset={handleResetFilters}
          />
        )}

        {!isLoading && !errorMessage && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3 px-5 pt-2" data-testid="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* 5. Bottom Navigation Bar chuẩn thiết kế */}
      <nav className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-stone-150 px-6 pt-2 pb-1 flex justify-between items-center z-30">
        {/* Nút Thực đơn (Active viên thuốc nâu nhạt) */}
        <button className="flex flex-col items-center gap-0.5 text-[#8A502F] bg-[#F5ECE5] px-4 py-1.5 rounded-full">
          <Coffee className="w-4 h-4 text-[#8A502F]" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>

        {/* Nút Đơn hàng */}
        <button className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-600 transition px-2">
          <ReceiptText className="w-4 h-4" />
          <span className="text-[10px] font-medium">Đơn hàng</span>
        </button>

        {/* Nút Tích điểm */}
        <button className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-600 transition px-2">
          <Gift className="w-4 h-4" />
          <span className="text-[10px] font-medium">Tích điểm</span>
        </button>

        {/* Nút Tài khoản */}
        <button className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-600 transition px-2">
          <User className="w-4 h-4" />
          <span className="text-[10px] font-medium">Tài khoản</span>
        </button>
      </nav>

      {/* Home Indicator */}
      <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none z-40">
        <div className="w-32 h-1 bg-stone-900 rounded-full" />
      </div>

      {/* 6. Modal Chi tiết món & Tùy biến overlay (Màn hình 2 trong thiết kế) */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
