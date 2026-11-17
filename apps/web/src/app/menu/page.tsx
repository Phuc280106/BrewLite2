'use client';

// ============================================================
// ManHinhMenu (Page Component) - /menu
// Responsive Mobile & Desktop (1440px) matching Figma designs:
//   - Frame 1: BrewLite · Beverage menu & home (Desktop) [65:321]
//   - Frame 2: BrewLite · Drink customization overlay (Desktop Modal) [65:322]
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Category, Product } from '@/types';
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
  ShoppingCart,
} from 'lucide-react';

const FALLBACK_CATEGORIES: Category[] = [
  { categoryId: 'ca-phe-phin', name: 'Cà phê pha phin', description: 'Cà phê pha phin truyền thống và máy' },
  { categoryId: 'tra-sua', name: 'Trà sữa', description: 'Trà sữa đậm vị kem béo' },
  { categoryId: 'tra-trai-cay', name: 'Trà trái cây tươi', description: 'Trà hoa quả tươi mát thanh nhiệt' },
  { categoryId: 'da-xay', name: 'Đá xay Freeze', description: 'Thức uống đá xay nhuyễn mát lạnh' },
];

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
      { sizeId: 'size-m', name: 'Size M (Vừa)', priceAdjustment: 0 },
      { sizeId: 'size-l', name: 'Size L (Lớn)', priceAdjustment: 8000 },
    ],
    toppings: [
      { toppingId: 'top-1', name: 'Trân châu hoàng kim', price: 8000 },
      { toppingId: 'top-2', name: 'Thạch củ năng giòn', price: 6000 },
      { toppingId: 'top-3', name: 'Kem Cheese Macchiato', price: 10000 },
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
      { sizeId: 'size-m', name: 'Size M (Vừa)', priceAdjustment: 0 },
      { sizeId: 'size-l', name: 'Size L (Lớn)', priceAdjustment: 8000 },
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
    category: { categoryId: 'tra-trai-cay', name: 'Trà trái cây tươi' },
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80',
    sizes: [
      { sizeId: 'size-m', name: 'Size M (Vừa)', priceAdjustment: 0 },
      { sizeId: 'size-l', name: 'Size L (Lớn)', priceAdjustment: 8000 },
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
    category: { categoryId: 'tra-trai-cay', name: 'Trà trái cây tươi' },
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80',
  },
  {
    productId: '9',
    name: 'Chocolate đá xay',
    description: 'Chocolate Bỉ đậm đặc xay cùng whipped cream',
    basePrice: 49000,
    categoryId: 'da-xay',
    category: { categoryId: 'da-xay', name: 'Đá xay Freeze' },
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80',
  },
  {
    productId: '10',
    name: 'Matcha đá xay',
    description: 'Đá xay matcha thơm béo sảng khoái bùng nổ',
    basePrice: 49000,
    categoryId: 'da-xay',
    category: { categoryId: 'da-xay', name: 'Đá xay Freeze' },
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const catRes = await fetch(`${API_BASE}/products/categories`, { cache: 'no-store' });
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData);
        }
      }

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
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 select-none flex flex-col">
      {/* 1. Header chuẩn Desktop & Mobile */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E9E3DC] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Dropdown chi nhánh */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#3D2615] text-white flex items-center justify-center shadow-sm">
              <Coffee className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h1 className="font-extrabold text-[#3D2615] text-xl sm:text-2xl leading-none tracking-tight">
                BrewLite
              </h1>
              <div className="flex items-center gap-1 text-xs text-stone-500 font-medium cursor-pointer hover:text-stone-700 mt-1">
                <span>SGU Central Hub</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </div>
            </div>
          </div>

          {/* SearchBar ở trung tâm trên Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-6">
            <SearchBar
              value={searchKeyword}
              onChange={setSearchKeyword}
              onClear={() => setSearchKeyword('')}
              placeholder="Tìm kiếm cà phê, trà trái cây..."
            />
          </div>

          {/* Tích điểm, User và Giỏ hàng ở góc phải */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Badge Tích điểm: 120 pts */}
            <div className="bg-[#EEF7F2] text-[#2D7A4D] font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-[#D5EFE0] shadow-xs">
              <Coins className="w-4 h-4 text-[#2D7A4D]" />
              <span>120 pts</span>
            </div>

            {/* Icon User trên desktop */}
            <button
              className="hidden sm:flex w-9 h-9 rounded-full border border-stone-200 items-center justify-center text-stone-600 hover:bg-stone-100 transition"
              title="Tài khoản"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Icon Giỏ hàng góc phải */}
            <button
              className="relative p-2 rounded-full text-stone-800 hover:text-stone-900 hover:bg-stone-100 transition flex items-center justify-center"
              onClick={() => {/* TODO: Giỏ hàng */}}
              title="Giỏ hàng"
            >
              <ShoppingCart className="w-5 h-5 text-[#3D2615]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#D97706] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* SearchBar trên thiết bị mobile */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar
            value={searchKeyword}
            onChange={setSearchKeyword}
            onClear={() => setSearchKeyword('')}
            placeholder="Tìm kiếm cà phê, trà trái cây..."
          />
        </div>
      </header>

      {/* 2. Vùng nội dung chính */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7 pb-36 sm:pb-40">
        
        {/* Banner món mới tuần này (Desktop 1280x280px / Mobile responsive) */}
        <div className="bg-[#3D2615] rounded-3xl overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between relative mb-8">
          <div className="p-6 md:p-10 max-w-xl z-10">
            <span className="text-xs sm:text-sm text-[#F7D6AD] font-medium block mb-2">
              Món mới tuần này
            </span>
            <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl leading-tight text-white mb-4">
              Trà Đào Cam Sả<br className="hidden sm:inline" /> Thượng Hạng
            </h2>
            <span className="bg-[#6A401C] text-[#FCE0AA] text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-full inline-block shadow-sm">
              Tích x2 điểm thưởng
            </span>
          </div>

          <div className="relative w-full md:w-1/2 h-52 sm:h-64 md:h-72 overflow-hidden flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&q=80"
              alt="Trà Đào Cam Sả Thượng Hạng"
              className="w-full h-full object-cover md:object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#3D2615] via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Thanh chọn Danh mục */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-3">
            <h3 className="font-extrabold text-[#3D2615] text-xl sm:text-2xl tracking-tight">
              Bạn uống gì hôm nay?
            </h3>
            <span className="text-xs sm:text-sm text-stone-500 font-normal">
              Pha mới, trọn vị.
            </span>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />
        </div>

        {/* 3. Lưới thẻ sản phẩm (4 cột trên Desktop, 2 cột trên Mobile) */}
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
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6 mb-8"
            data-testid="product-grid"
          >
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

      {/* 4. Bottom Navigation Bar cố định ở cuối trang, không bị cuộn */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E9E3DC] z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-around sm:justify-center sm:gap-14 items-center">
          {/* Nút Thực đơn (Active) */}
          <button className="flex flex-col sm:flex-row items-center gap-1 text-[#3D2615] bg-[#F5ECE5] px-4 py-1.5 rounded-full transition font-bold text-xs sm:text-sm">
            <Coffee className="w-4 h-4 text-[#3D2615]" />
            <span>Menu</span>
          </button>

          {/* Nút Đơn hàng */}
          <button className="flex flex-col sm:flex-row items-center gap-1 text-stone-500 hover:text-[#3D2615] transition px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
            <ReceiptText className="w-4 h-4" />
            <span>Đơn hàng</span>
          </button>

          {/* Nút Tích điểm */}
          <button className="flex flex-col sm:flex-row items-center gap-1 text-stone-500 hover:text-[#3D2615] transition px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
            <Gift className="w-4 h-4" />
            <span>Tích điểm</span>
          </button>

          {/* Nút Tài khoản */}
          <button className="flex flex-col sm:flex-row items-center gap-1 text-stone-500 hover:text-[#3D2615] transition px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
            <User className="w-4 h-4" />
            <span>Tài khoản</span>
          </button>
        </div>
      </nav>

      {/* 5. Modal Chi tiết món & Tùy biến overlay (Màn hình 2 chuẩn Desktop Dialog) */}
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
