'use client';

// ============================================================
// BrewLite Auth Page (/auth)
// Responsive Desktop, Tablet, and Mobile matching Figma screens:
//   - Frame: BrewLite · Sign in & sign up screen (IUwGwAon8cvD3CtxHPsfHW)
// ============================================================

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Coffee,
  Sparkles,
  Clock,
  Coins,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { AuthMode } from '@/types/auth';

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get('mode') as AuthMode | null;
  const initialMode: AuthMode = modeParam === 'signup' || modeParam === 'forgot' ? modeParam : 'signin';

  return (
    <div className="min-h-screen bg-[#FBF8F5] text-[#1F1612] flex flex-col justify-between">
      {/* 1. Thanh điều hướng tối giản phía trên */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6B5D55] hover:text-[#2B1810] transition py-1 px-3 rounded-full hover:bg-[#F5ECE5]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Về Thực đơn</span>
        </Link>
      </header>

      {/* 2. Nội dung chính: Phân chia Layout Responsive */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 flex items-center justify-center">
        {/* Desktop Layout: Split Grid 2 Cột (>=1024px) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* CỘT TRÁI (Desktop Showcase): Hình ảnh & Giá trị thương hiệu */}
          <section className="hidden lg:flex lg:col-span-7 flex-col justify-between bg-gradient-to-br from-[#2B1810] via-[#362115] to-[#1E100A] text-white p-10 xl:p-14 rounded-3xl shadow-2xl relative overflow-hidden min-h-[580px]">
            {/* Background Texture & Glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#C8682E]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#D97706]/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C8682E] to-[#D97706] flex items-center justify-center text-white shadow-lg">
                  <Coffee className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                    BrewLite
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8682E]/30 text-[#FED7AA] font-medium border border-[#C8682E]/40">
                      Specialty Coffee
                    </span>
                  </h1>
                  <p className="text-xs text-stone-300">Cà phê chuẩn vị, đặt món tức thì</p>
                </div>
              </div>

              {/* Headline & Quote */}
              <div className="pt-4 space-y-3 max-w-lg">
                <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
                  Thưởng thức từng giọt <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDBA74] to-[#F59E0B]">cảm hứng</span> mỗi ngày.
                </h2>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Từng hạt cà phê Robusta & Arabica Cầu Đất nguyên bản, rang xay tươi mới và pha chế theo tỉ lệ vàng dành riêng cho bạn.
                </p>
              </div>

              {/* 3 Lợi ích thành viên BrewLite */}
              <div className="pt-6 grid grid-cols-1 gap-3.5 max-w-md">
                <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF7F2]/20 text-[#34D399] flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5 text-[#34D399]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Tích lũy 10% mỗi hóa đơn</h3>
                    <p className="text-xs text-stone-300">Đổi điểm lấy đồ uống và bánh ngọt miễn phí.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF3C7]/20 text-[#FBBF24] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#FBBF24]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Đặt trước, lấy ngay trong 5 phút</h3>
                    <p className="text-xs text-stone-300">Không phải xếp hàng chờ đợi giờ cao điểm.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE9FE]/20 text-[#A78BFA] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-[#A78BFA]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Chất lượng hạt sạch tiêu chuẩn</h3>
                    <p className="text-xs text-stone-300">Cam kết 100% nguyên chất, không tạp chất độn.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Store Info */}
            <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-stone-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                BrewLite Loyalty Hub 2026
              </span>
              <span>Hotline CSKH: 1900 6868</span>
            </div>
          </section>

          {/* CỘT PHẢI (Desktop) & TOÀN BỘ TRÊN MOBILE/TABLET */}
          <section className="w-full lg:col-span-5 flex flex-col items-center max-w-md mx-auto">
            {/* Header trên Mobile & Tablet (<1024px) */}
            <div className="lg:hidden text-center mb-6 space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#2B1810] to-[#C8682E] flex items-center justify-center text-white shadow-lg">
                <Coffee className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-[#1F1612] tracking-tight">BrewLite</h1>
              <p className="text-xs sm:text-sm text-[#6B5D55]">Cà phê chuẩn vị, đặt món tức thì</p>
            </div>

            {/* Form Xác thực (4 Variants) */}
            <AuthForm
              initialMode={initialMode}
              onSuccess={() => router.push('/menu')}
            />
          </section>

        </div>
      </main>

      {/* 3. Footer tối giản */}
      <footer className="w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-stone-400">
        <p>© 2026 BrewLite Coffee. All rights reserved · Bản quyền thuộc hệ sinh thái F&B BrewLite.</p>
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBF8F5] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#C8682E] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[#6B5D55]">Đang tải BrewLite...</p>
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
