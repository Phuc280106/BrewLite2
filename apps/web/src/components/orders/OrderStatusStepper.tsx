'use client';

import React from 'react';
import { BellRing, Check, Clock, Coffee, CreditCard, XCircle } from 'lucide-react';
import { OrderStatus } from '@/types/order';
import { getOrderStepIndex } from '@/lib/orders';

interface OrderStatusStepperProps {
  status: OrderStatus;
}

const STEPS = [
  { key: 'PENDING', lines: ['Chờ tiếp', 'nhận'] },
  { key: 'PAID', lines: ['Đã thanh', 'toán'] },
  { key: 'PREPARING', lines: ['Đang pha', 'chế'] },
  { key: 'READY', lines: ['Sẵn sàng', 'lấy món'] },
  { key: 'COMPLETED', lines: ['Hoàn tất'] },
] as const;

export const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({
  status,
}) => {
  const activeIndex = getOrderStepIndex(status);

  // AC-07.4: Trạng thái ngoại lệ CANCELLED hoặc PAYMENT_FAILED
  if (activeIndex < 0) {
    const isPaymentFailed = status === 'PAYMENT_FAILED';
    return (
      <div
        data-testid="order-status-stepper-cancelled"
        className="w-full rounded-[20px] border border-[#FECACA] bg-[#FEF2F2] p-4 flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-[#FEE2E2] text-[#D92D2D] flex items-center justify-center shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#B91C1C]">
            {isPaymentFailed
              ? 'Giao dịch thanh toán chưa hoàn tất'
              : 'Đơn hàng đã bị hủy'}
          </p>
          <p className="text-xs text-[#991B1B] mt-0.5 leading-relaxed">
            {isPaymentFailed
              ? 'Thanh toán thất bại nên đơn hàng chưa được chuyển xuống quầy pha chế.'
              : 'Tiến trình pha chế đã dừng lại và tồn kho nguyên liệu đã được hoàn trả.'}
          </p>
        </div>
      </div>
    );
  }

  const isAllCompleted = status === 'COMPLETED';

  const renderActiveIcon = (stepIndex: number) => {
    if (stepIndex === 0) {
      return <Clock className="w-[18px] h-[18px] text-white animate-brewlite-cup" />;
    }
    if (stepIndex === 1) {
      return <CreditCard className="w-[18px] h-[18px] text-white animate-brewlite-cup" />;
    }
    if (stepIndex === 3) {
      return <BellRing className="w-[18px] h-[18px] text-white animate-brewlite-cup" />;
    }
    if (stepIndex === 4) {
      return <Check className="w-[18px] h-[18px] text-white stroke-[2.75]" />;
    }
    return <Coffee className="w-[19px] h-[19px] text-white animate-brewlite-cup" />;
  };

  return (
    <div
      data-testid="order-status-stepper"
      aria-label="Tiến trình xử lý đơn hàng"
      className="relative w-full pt-1 pb-1"
    >
      {/* 5 cột mốc trạng thái tách biệt rõ ràng PAID và PREPARING */}
      <div className="grid grid-cols-5 relative">
        {STEPS.map((step, index) => {
          const isCompleted = isAllCompleted || index < activeIndex;
          const isActive = !isAllCompleted && index === activeIndex;
          const isConnectorCompleted = isAllCompleted || index < activeIndex;

          return (
            <div
              key={step.key}
              className="relative flex flex-col items-center gap-[6px]"
              data-step-state={
                isCompleted ? 'completed' : isActive ? 'active' : 'upcoming'
              }
            >
              {/* Đường nối ngang sang mốc kế tiếp */}
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={`absolute top-[17px] left-[calc(50%+18px)] right-[calc(-50%+18px)] h-[2px] rounded-[1px] transition-colors duration-300 ${
                    isConnectorCompleted ? 'bg-[#10B981]' : 'bg-[#DCD6CF]'
                  }`}
                />
              )}

              {/* Biểu tượng mốc (36x36 khung ngoài, 32x32 vòng tròn chính) */}
              <div className="relative z-10 w-[36px] h-[36px] flex items-center justify-center">
                {isCompleted ? (
                  <div className="w-[32px] h-[32px] rounded-full bg-[#147D56] flex items-center justify-center shadow-xs">
                    <Check className="w-[18px] h-[18px] text-white stroke-[2.75]" />
                  </div>
                ) : isActive ? (
                  <>
                    {/* Vòng sáng nhịp thở đúng Figma node 14:88 */}
                    <span
                      aria-hidden="true"
                      className="absolute w-[42px] h-[42px] rounded-full bg-[#F5D7A9] animate-brewlite-halo"
                    />
                    {/* Vòng tròn active màu hổ phách đúng Figma node 14:89 */}
                    <div className="relative z-10 w-[32px] h-[32px] rounded-full bg-[#D97706] flex items-center justify-center shadow-xs">
                      {renderActiveIcon(index)}
                    </div>
                  </>
                ) : (
                  <div className="w-[32px] h-[32px] rounded-full bg-[#F0ECE6] flex items-center justify-center">
                    <span className="w-[8px] h-[8px] rounded-full bg-[#B6ADA2]" />
                  </div>
                )}
              </div>

              {/* Nhãn mốc 2 dòng căn giữa */}
              <div
                className={`text-[11px] sm:text-[13px] leading-[15px] sm:leading-[17px] text-center select-none ${
                  isCompleted
                    ? 'font-semibold text-[#147D56]'
                    : isActive
                      ? 'font-semibold text-[#9A5305]'
                      : 'font-normal text-[#6B6B66]'
                }`}
              >
                {step.lines.map((line) => (
                  <p key={line} className="m-0">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
