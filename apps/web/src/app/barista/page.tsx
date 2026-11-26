'use client';

// ============================================================
// BrewLite Barista KDS (Kitchen Display System) - /barista
// Bảng điều khiển quản lý hàng đợi & cập nhật tiến trình pha chế (FR-09)
// Dành cho nhân viên quầy (BARISTA / ADMIN)
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BellRing,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Flame,
  Home,
  Loader2,
  LogIn,
  RefreshCw,
  Search,
  Sparkles,
  Utensils,
  XCircle,
} from 'lucide-react';
import { OrderRecord, OrderStatus } from '@/types/order';
import {
  OrderApiError,
  cancelOrderById,
  fetchBaristaQueue,
  formatOrderCode,
  getShortPickupCode,
  updateOrderStatusByBarista,
} from '@/lib/orders';
import { getCurrentUser, login } from '@/lib/auth';

type QueueFilterTab = 'ALL' | 'PAID' | 'PREPARING' | 'READY';

function getElapsedTimeMinutes(isoString: string): number {
  const diffMs = Date.now() - new Date(isoString).getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}

function formatElapsedTime(isoString: string): string {
  const mins = getElapsedTimeMinutes(isoString);
  if (mins < 1) return 'Vừa đặt';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m trước`;
}

export default function BaristaQueuePage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<QueueFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isLoggingInBarista, setIsLoggingInBarista] = useState(false);
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderRecord | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Kiểm tra quyền Barista / Admin
  const isStaff = currentUser?.role === 'BARISTA' || currentUser?.role === 'ADMIN';

  const loadQueue = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    try {
      const data = await fetchBaristaQueue();
      setOrders(data);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof OrderApiError) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách hàng đợi pha chế.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Nạp dữ liệu lần đầu
  useEffect(() => {
    setHasMounted(true);
    setCurrentUser(getCurrentUser());
    loadQueue(false);
  }, [loadQueue]);

  // Polling tự động mỗi 8 giây
  useEffect(() => {
    if (!autoRefresh || !isStaff) return;
    const interval = setInterval(() => {
      loadQueue(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, isStaff, loadQueue]);

  // Tự ẩn thông báo thành công sau 4 giây
  useEffect(() => {
    if (!actionSuccessMessage) return;
    const timer = setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
    return () => clearInterval(timer);
  }, [actionSuccessMessage]);

  // Đăng nhập nhanh tài khoản Barista mẫu (cho giảng viên/reviewer tiện test)
  const handleQuickLoginBarista = async () => {
    setIsLoggingInBarista(true);
    setError(null);
    try {
      await login({
        email: 'barista@gmail.com',
        password: '123456',
      });
      setCurrentUser(getCurrentUser());
      await loadQueue(false);
      setActionSuccessMessage('Đã đăng nhập thành công với tài khoản Barista!');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đăng nhập tài khoản barista@gmail.com.',
      );
    } finally {
      setIsLoggingInBarista(false);
    }
  };

  // Cập nhật trạng thái đơn (One-click action)
  const handleAdvanceStatus = async (order: OrderRecord, nextStatus: OrderStatus) => {
    if (updatingOrderId) return;
    setUpdatingOrderId(order.orderId);
    setError(null);

    try {
      const updated = await updateOrderStatusByBarista(order.orderId, nextStatus);
      const code = getShortPickupCode(order.orderId);

      let actionDesc = 'Đã cập nhật trạng thái đơn';
      if (nextStatus === 'PREPARING') actionDesc = `Đã nhận pha chế đơn ${code}`;
      if (nextStatus === 'READY') actionDesc = `Đơn ${code} đã pha xong! Sẵn sàng giao khách`;
      if (nextStatus === 'COMPLETED') actionDesc = `Đơn ${code} đã hoàn tất bàn giao khách`;

      setActionSuccessMessage(actionDesc);

      // Nếu đơn chuyển sang COMPLETED thì loại khỏi hàng đợi, ngược lại cập nhật trạng thái
      if (nextStatus === 'COMPLETED') {
        setOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.orderId === order.orderId ? updated : o)),
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái đơn hàng.',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Hủy đơn hàng từ phía quầy & hoàn kho
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder || isCancelling) return;
    setIsCancelling(true);
    try {
      await cancelOrderById(cancelModalOrder.orderId);
      const code = getShortPickupCode(cancelModalOrder.orderId);
      setActionSuccessMessage(`Đã hủy đơn ${code} và hoàn trả nguyên liệu.`);
      setOrders((prev) => prev.filter((o) => o.orderId !== cancelModalOrder.orderId));
      setCancelModalOrder(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể hủy đơn hàng này.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Thống kê số lượng đơn theo từng trạng thái
  const counts = useMemo(() => {
    const paid = orders.filter((o) => o.status === 'PAID').length;
    const preparing = orders.filter((o) => o.status === 'PREPARING').length;
    const ready = orders.filter((o) => o.status === 'READY').length;
    return {
      total: orders.length,
      paid,
      preparing,
      ready,
    };
  }, [orders]);

  // Lọc theo tab & từ khóa tìm kiếm (mã đơn, mã nhận món, tên khách)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Lọc tab
      if (activeTab !== 'ALL' && order.status !== activeTab) {
        return false;
      }
      // Tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const code = formatOrderCode(order.orderId).toLowerCase();
        const shortCode = getShortPickupCode(order.orderId).toLowerCase();
        const hasItem = order.items.some((i) =>
          i.productName.toLowerCase().includes(q),
        );
        return code.includes(q) || shortCode.includes(q) || hasItem;
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1F1610] flex flex-col">
      {/* 1. KDS Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-[#3D2615] text-white shadow-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              title="Về Menu khách hàng"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              <Home className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#D97706] flex items-center justify-center">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg leading-tight flex items-center gap-2">
                  <span>BrewLite · Quầy pha chế (KDS)</span>
                  <span className="hidden sm:inline-block text-[11px] font-semibold bg-[#10B981] px-2 py-0.5 rounded-full text-white uppercase tracking-wider">
                    Live
                  </span>
                </h1>
                <p className="text-xs text-white/70 hidden sm:block">
                  Hệ thống hiển thị & cập nhật tiến trình đơn hàng tại quầy
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-2">
            {/* Auto refresh toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              title={autoRefresh ? 'Tắt tự động làm mới' : 'Bật tự động làm mới'}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                autoRefresh
                  ? 'bg-[#10B981]/20 text-[#6EE7B7] border border-[#10B981]/40'
                  : 'bg-white/10 text-white/70 border border-white/15'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoRefresh ? 'bg-[#10B981] animate-pulse' : 'bg-stone-400'
                }`}
              />
              <span className="hidden md:inline">Tự động nạp:</span>
              <span>{autoRefresh ? 'Bật (8s)' : 'Tắt'}</span>
            </button>

            {/* Manual refresh button */}
            <button
              type="button"
              onClick={() => loadQueue(false)}
              disabled={isLoading || isRefreshing}
              className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D97706]' : ''}`}
              />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            {/* Current user badge / Login shortcut */}
            {hasMounted && currentUser ? (
              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/20 text-xs">
                <div className="text-right">
                  <p className="font-semibold text-white leading-tight">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-[#FBBF24]">
                    Quyền: {currentUser.role || 'STAFF'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* 2. Banner cảnh báo quyền tài khoản nếu không phải BARISTA / ADMIN */}
      {hasMounted && !isStaff && (
        <div className="bg-[#FEF3C7] border-b border-[#F5D7A9] px-4 py-3 text-xs sm:text-sm text-[#92400E]">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0" />
              <span>
                Bạn đang xem giao diện Barista nhưng tài khoản hiện tại{' '}
                <strong className="underline">
                  {currentUser ? `(${currentUser.email} - ${currentUser.role})` : '(Chưa đăng nhập)'}
                </strong>{' '}
                chưa có quyền nhân viên. Vui lòng đăng nhập tài khoản Barista để lấy dữ liệu.
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickLoginBarista}
              disabled={isLoggingInBarista}
              className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
            >
              {isLoggingInBarista ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Đăng nhập Barista mẫu ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Success notification toast */}
      {actionSuccessMessage && (
        <div className="sticky top-16 z-20 bg-[#ECFDF5] border-b border-[#A7F3D0] px-4 py-2.5 text-xs sm:text-sm text-[#065F46] flex items-center justify-between gap-2 shadow-xs transition animate-in fade-in">
          <div className="max-w-[1400px] mx-auto w-full flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* 4. Error notification */}
      {error && (
        <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-3 text-xs sm:text-sm text-[#B91C1C]">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[#991B1B] hover:text-[#7F1D1D] font-bold text-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Status Counts & KPI Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Tổng đơn hoạt động */}
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-white border-[#3D2615] ring-2 ring-[#3D2615]/20 shadow-sm'
                : 'bg-white border-[#EAE4DB] hover:border-stone-400'
            }`}
          >
            <p className="text-xs text-[#6B6B66] font-medium">Hàng đợi tổng</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-[#1F1610]">{counts.total}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3EFEA] text-[#3D2615]">
                Đang xử lý
              </span>
            </div>
          </button>

          {/* Chờ pha chế (PAID) */}
          <button
            type="button"
            onClick={() => setActiveTab('PAID')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'PAID'
                ? 'bg-white border-[#147D56] ring-2 ring-[#147D56]/20 shadow-sm'
                : 'bg-white border-[#EAE4DB] hover:border-stone-400'
            }`}
          >
            <p className="text-xs text-[#147D56] font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ quầy nhận (PAID)</span>
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-[#147D56]">{counts.paid}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#147D56]">
                Bước 1
              </span>
            </div>
          </button>

          {/* Đang pha chế (PREPARING) */}
          <button
            type="button"
            onClick={() => setActiveTab('PREPARING')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'PREPARING'
                ? 'bg-white border-[#D97706] ring-2 ring-[#D97706]/20 shadow-sm'
                : 'bg-white border-[#EAE4DB] hover:border-stone-400'
            }`}
          >
            <p className="text-xs text-[#D97706] font-medium flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5" />
              <span>Đang pha chế</span>
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-[#D97706]">{counts.preparing}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#9A5305]">
                Bước 2
              </span>
            </div>
          </button>

          {/* Sẵn sàng lấy món (READY) */}
          <button
            type="button"
            onClick={() => setActiveTab('READY')}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === 'READY'
                ? 'bg-white border-[#10B981] ring-2 ring-[#10B981]/20 shadow-sm'
                : 'bg-white border-[#EAE4DB] hover:border-stone-400'
            }`}
          >
            <p className="text-xs text-[#10B981] font-medium flex items-center gap-1">
              <BellRing className="w-3.5 h-3.5" />
              <span>Sẵn sàng giao</span>
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-[#10B981]">{counts.ready}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669]">
                Bước 3
              </span>
            </div>
          </button>
        </section>

        {/* Filter bar & Search */}
        <section className="bg-white rounded-2xl border border-[#EAE4DB] p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#3D2615] text-white'
                  : 'text-[#6B6B66] hover:bg-stone-100'
              }`}
            >
              Tất cả ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PAID')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'PAID'
                  ? 'bg-[#147D56] text-white'
                  : 'text-[#6B6B66] hover:bg-stone-100'
              }`}
            >
              Chờ pha ({counts.paid})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PREPARING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'PREPARING'
                  ? 'bg-[#D97706] text-white'
                  : 'text-[#6B6B66] hover:bg-stone-100'
              }`}
            >
              Đang pha ({counts.preparing})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('READY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === 'READY'
                  ? 'bg-[#10B981] text-white'
                  : 'text-[#6B6B66] hover:bg-stone-100'
              }`}
            >
              Sẵn sàng ({counts.ready})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn (#8921) hoặc món..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#F7F4EF] border border-[#EAE4DB] text-xs text-[#1F1610] placeholder:text-stone-400 focus:outline-none focus:border-[#3D2615]"
            />
          </div>
        </section>

        {/* 6. Order Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#D97706] animate-spin mb-3" />
            <p className="text-sm font-semibold text-[#1F1610]">
              Đang tải hàng đợi pha chế...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 bg-white rounded-3xl border border-[#EAE4DB] p-8 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-[#1F1610]">
              Quầy pha chế đang trống!
            </h3>
            <p className="text-sm text-[#6B6B66] max-w-[360px] mx-auto mt-1">
              Không có đơn nào trong mục này. Khi khách đặt món và thanh toán, đơn sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const orderCode = formatOrderCode(order.orderId);
              const pickupCode = getShortPickupCode(order.orderId);
              const elapsedMinutes = getElapsedTimeMinutes(order.createdAt);
              const isLongWait = elapsedMinutes >= 10;
              const isUpdatingThis = updatingOrderId === order.orderId;

              return (
                <div
                  key={order.orderId}
                  data-testid={`barista-order-card-${order.orderId}`}
                  className="bg-white rounded-2xl border border-[#EAE4DB] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  {/* Card Header: Mã đơn to, hình thức, thời gian chờ */}
                  <div className="p-4 border-b border-[#EAE4DB]/80 bg-[#FFFDF9]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            data-testid="pickup-code-display"
                            className="text-2xl font-black text-[#3D2615] tracking-tight"
                          >
                            {pickupCode}
                          </span>
                          <span className="text-xs text-[#6B6B66] font-mono">
                            #{orderCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {order.pickupMethod && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#F5ECE5] text-[#7C4A15]">
                              {order.pickupMethod === 'DINE_IN' ? 'Tại quán' : 'Mang đi'}
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                              isLongWait
                                ? 'bg-[#FEF2F2] text-[#B91C1C] font-semibold'
                                : 'bg-stone-100 text-[#4B5563]'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{formatElapsedTime(order.createdAt)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {order.status === 'PAID' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF7EE] text-[#147D56] border border-[#BCE5CC] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Chờ pha</span>
                          </span>
                        )}
                        {order.status === 'PREPARING' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FEF3C7] text-[#9A5305] border border-[#F5D7A9] flex items-center gap-1 animate-pulse">
                            <Flame className="w-3 h-3" />
                            <span>Đang pha</span>
                          </span>
                        )}
                        {order.status === 'READY' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#126844] border border-[#86EFAC] flex items-center gap-1">
                            <BellRing className="w-3 h-3" />
                            <span>Chờ khách lấy</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Chi tiết từng món & Ghi chú */}
                  <div className="p-4 space-y-3 flex-1">
                    <div className="space-y-2.5">
                      {order.items.map((item, idx) => {
                        const toppings = item.toppings ?? [];
                        const sizeLabel = item.size?.name
                          ? item.size.name.toLowerCase().startsWith('size')
                            ? item.size.name
                            : `Size ${item.size.name}`
                          : 'Size tiêu chuẩn';
                        const options = [
                          sizeLabel,
                          item.sugarLevel,
                          item.iceLevel,
                        ].filter(Boolean);

                        return (
                          <div
                            key={item.orderItemId || idx}
                            className="pb-2.5 border-b border-stone-100 last:border-0 last:pb-0"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-sm text-[#1F1610]">
                                {item.quantity}× {item.productName}
                              </span>
                            </div>

                            {/* Size, Đường, Đá */}
                            <p className="text-xs text-[#4B5563] mt-0.5 font-medium">
                              {options.join(' · ')}
                            </p>

                            {/* Toppings list */}
                            {toppings.length > 0 && (
                              <p className="text-xs text-[#6B6B66] mt-0.5">
                                + {toppings.map((t) => t.name).join(', ')}
                              </p>
                            )}

                            {/* Ghi chú pha chế riêng biệt */}
                            {item.note && (
                              <div className="mt-1.5 p-1.5 bg-[#FFF8EB] border border-[#FDE68A] rounded-lg flex items-start gap-1.5">
                                <Utensils className="w-3 h-3 text-[#D97706] shrink-0 mt-0.5" />
                                <span className="text-xs text-[#92400E] font-medium leading-tight">
                                  Ghi chú: {item.note}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer: Action Buttons đổi trạng thái 1 chạm */}
                  <div className="p-3 bg-stone-50 border-t border-[#EAE4DB] flex items-center justify-between gap-2">
                    {/* Nút hủy đơn (phụ) */}
                    <button
                      type="button"
                      onClick={() => setCancelModalOrder(order)}
                      title="Hủy đơn này nếu có sự cố"
                      className="px-2.5 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition cursor-pointer"
                    >
                      Hủy đơn
                    </button>

                    {/* Nút chính chuyển tiếp trạng thái theo State Machine */}
                    {order.status === 'PAID' && (
                      <button
                        type="button"
                        disabled={isUpdatingThis}
                        onClick={() => handleAdvanceStatus(order, 'PREPARING')}
                        className="flex-1 h-10 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Coffee className="w-4 h-4" />
                        )}
                        <span>Bắt đầu pha chế</span>
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        type="button"
                        disabled={isUpdatingThis}
                        onClick={() => handleAdvanceStatus(order, 'READY')}
                        className="flex-1 h-10 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <BellRing className="w-4 h-4" />
                        )}
                        <span>Đã pha xong (Báo lấy)</span>
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        type="button"
                        disabled={isUpdatingThis}
                        onClick={() => handleAdvanceStatus(order, 'COMPLETED')}
                        className="flex-1 h-10 px-4 rounded-xl bg-[#147D56] hover:bg-[#0F5F41] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingThis ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        )}
                        <span>Đã giao khách</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 7. Modal xác nhận hủy đơn */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-[400px] bg-white rounded-3xl border border-[#EAE4DB] p-5 shadow-xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-base text-[#1F1610]">
                Xác nhận hủy đơn #{getShortPickupCode(cancelModalOrder.orderId)}?
              </h4>
              <p className="text-xs text-[#6B6B66] mt-1 leading-relaxed">
                Khi hủy đơn, tiến trình pha chế sẽ dừng lại và hệ thống sẽ tự động hoàn kho nguyên liệu theo đúng công thức món.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 h-10 rounded-xl border border-[#EAE4DB] text-xs font-semibold text-[#4B5563] hover:bg-stone-50 transition cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 h-10 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Xác nhận hủy</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
