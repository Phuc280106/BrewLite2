import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite – Đặt đồ uống nhanh chóng',
  description: 'BrewLite Mobile-first PWA đặt cà phê, trà sữa, đá xay tiện lợi',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8A502F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex items-center justify-center p-0 md:p-6 bg-stone-950">
        {/* Khung mô phỏng thiết bị di động Mobile-first PWA chuẩn Figma */}
        <div className="mobile-frame w-full max-w-[420px] h-screen md:h-[890px] bg-stone-50 md:rounded-[44px] overflow-hidden flex flex-col relative md:border-[8px] md:border-stone-900 shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
