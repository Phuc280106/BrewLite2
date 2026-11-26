'use client';

// ============================================================
// ManHinhMenu (Page Component) - /menu
// Responsive Mobile & Desktop (1440px) matching Figma designs:
//   - Frame 1: BrewLite · Beverage menu & home (Desktop) [65:321]
//   - Frame 2: BrewLite · Drink customization overlay (Desktop Modal) [65:322]
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Category, Product } from '@/types';
import { AddToCartInput } from '@/types/cart';
import { AuthUser } from '@/types/auth';
import { logout, onAuthStateChange } from '@/lib/auth';
import { useCartStore } from '@/store/useCartStore';
import { formatVND } from '@/lib/cartPricing';
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
  LogOut,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function MenuPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const cartItems = useCartStore((state) => state.items);
  const addCartItem = useCartStore((state) => state.addItem);
  const hasCartHydrated = useCartStore((state) => state.hasHydrated);

  const cartCount = hasCartHydrated
    ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  useEffect(() => {
    const unsub = onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

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
      if (!prodRes.ok) {
        throw new Error(`Máy chủ trả về lỗi ${prodRes.status}`);
      }
      const prodData: unknown = await prodRes.json();
      if (!Array.isArray(prodData)) {
        throw new Error('Dữ liệu thực đơn không hợp lệ');
      }

      // Sản phẩm từ ProductsModule đã bao gồm isAvailable và maxServings
      const finalProducts = prodData as Product[];

      // Danh sách rỗng là kết quả hợp lệ (lọc/tìm kiếm không có món) -> hiện EmptyState
      setProducts(finalProducts);
    } catch {
      // Không dùng dữ liệu giả: món giả có ID không phải UUID sẽ làm đặt hàng thất bại
      setProducts([]);
      setErrorMessage(
        'Không thể tải thực đơn từ máy chủ. Hãy kiểm tra API (cổng 3001) đã chạy và database đã được seed, rồi bấm thử lại.',
      );
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

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleResetFilters = () => {
    setSelectedCategoryId(null);
    setSearchKeyword('');
  };

  const handleAddToCart = (payload: AddToCartInput) => {
    const added = addCartItem(payload);
    setToastType('success');
    setToastMessage(
      `Đã thêm ${payload.quantity}x ${added.productName} (${formatVND(added.unitPrice * payload.quantity)}) vào giỏ hàng`,
    );
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
            {/* Badge Tích điểm: chỉ hiện khi đã đăng nhập (không còn hiện 120 điểm giả khi chưa đăng nhập) */}
            {currentUser && (
              <div className="bg-[#EEF7F2] text-[#2D7A4D] font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-[#D5EFE0] shadow-xs">
                <Coins className="w-4 h-4 text-[#2D7A4D]" />
                <span>{currentUser.points ?? 0} pts</span>
              </div>
            )}

            {/* Icon User trên desktop */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => {
                  if (!currentUser) {
                    router.push('/auth');
                  } else {
                    setIsUserMenuOpen((prev) => !prev);
                  }
                }}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition font-semibold text-xs cursor-pointer ${
                  currentUser
                    ? 'bg-[#2B1810] text-white border-[#2B1810] shadow-sm hover:bg-[#1E100A]'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
                title={currentUser ? currentUser.name : 'Tài khoản'}
              >
                {currentUser ? (
                  <span>
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(-2)
                      .join('')
                      .toUpperCase()}
                  </span>
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>

              {/* User Dropdown / Popup */}
              {currentUser && isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E5E0D8] p-4 z-50 animate-fadeIn">
                    <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
                      <div className="w-10 h-10 rounded-full bg-[#2B1810] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {currentUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(-2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1F1612] truncate">{currentUser.name}</p>
                        <p className="text-xs text-stone-500 truncate">{currentUser.email}</p>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5ECE5] text-[#C8682E]">
                          <span>{currentUser.role === 'BARISTA' ? 'Pha chế / Thu ngân' : 'Thành viên BrewLite'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Điểm tích lũy */}
                    <div className="py-2.5 flex items-center justify-between text-xs text-stone-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Coins className="w-3.5 h-3.5 text-[#2D7A4D]" />
                        Điểm BrewLite
                      </span>
                      <span className="font-bold text-[#2D7A4D]">{currentUser.points ?? 0} pts</span>
                    </div>

                    {/* Nút Đăng xuất */}
                    <div className="pt-2 border-t border-stone-100">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Icon Giỏ hàng góc phải */}
            <button
              className="relative p-2.5 min-w-[44px] min-h-[44px] rounded-full text-stone-800 hover:text-stone-900 hover:bg-stone-100 transition flex items-center justify-center cursor-pointer"
              onClick={() => router.push('/cart')}
              title="Giỏ hàng"
              aria-label="Mở giỏ hàng"
              data-testid="header-cart-button"
            >
              <ShoppingCart className="w-5 h-5 text-[#3D2615]" />
              {cartCount > 0 && (
                <span
                  data-testid="header-cart-badge"
                  className="absolute top-0.5 right-0.5 bg-[#D97706] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-xs"
                >
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
                onSelect={(p) => {
                  if (p.isAvailable === false) {
                    setToastType('error');
                    setToastMessage('Sản phẩm đã hết hàng, vui lòng chọn sản phẩm khác.');
                    return;
                  }

                  setSelectedProduct(p);
                }}
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
          <button
            onClick={() => router.push('/orders/my-orders')}
            className="flex flex-col sm:flex-row items-center gap-1 text-stone-500 hover:text-[#3D2615] transition px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium cursor-pointer"
          >
            <ReceiptText className="w-4 h-4" />
            <span>Đơn hàng</span>
          </button>

          {/* Nút Tích điểm */}
          <button className="flex flex-col sm:flex-row items-center gap-1 text-stone-500 hover:text-[#3D2615] transition px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
            <Gift className="w-4 h-4" />
            <span>Tích điểm</span>
          </button>

          {/* Nút Tài khoản */}
          <button
            onClick={() => {
              if (!currentUser) {
                router.push('/auth');
              } else {
                setIsUserMenuOpen((prev) => !prev);
              }
            }}
            className="flex flex-col sm:flex-row items-center gap-1 text-stone-500 hover:text-[#3D2615] transition px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>{currentUser ? currentUser.name.split(' ').slice(-1)[0] : 'Tài khoản'}</span>
          </button>
        </div>
      </nav>

      {toastMessage && (
        <div
          role={toastType === 'error' ? 'alert' : 'status'}
          className={`fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fadeIn ${
            toastType === 'error'
              ? 'bg-red-700 border border-red-900/30'
              : 'bg-[#3D2615] border border-amber-900/30'
          }`}
        >
          <span className="text-xs sm:text-sm font-medium leading-snug">{toastMessage}</span>
          {toastType === 'success' && (
            <button
              type="button"
              onClick={() => router.push('/cart')}
              className="shrink-0 bg-[#D97706] hover:bg-[#C26804] text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Xem giỏ hàng
            </button>
          )}
        </div>
      )}

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