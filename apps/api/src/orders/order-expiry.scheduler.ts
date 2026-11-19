import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ORDER_EXPIRY_SCAN_INTERVAL_MS } from './order-expiry.constants';
import { OrdersService } from './orders.service';

/**
 * OrderExpiryScheduler (sequence "Hủy đơn & hoàn kho khi quá 15 phút"):
 * mỗi phút gọi OrdersService.huyDonQuaHan() -> cancelExpiredOrders().
 * Dùng setInterval nên không cần thêm dependency @nestjs/schedule.
 */
@Injectable()
export class OrderExpiryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpiryScheduler.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly ordersService: OrdersService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => void this.tick(), ORDER_EXPIRY_SCAN_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    if (this.running) return; // tránh chồng lượt quét nếu lượt trước chưa xong
    this.running = true;
    try {
      const cancelled = await this.ordersService.cancelExpiredOrders();
      if (cancelled > 0) {
        this.logger.log(`Đã hủy ${cancelled} đơn quá hạn và hoàn kho`);
      }
    } catch (error) {
      this.logger.error('Quét đơn quá hạn thất bại', error as Error);
    } finally {
      this.running = false;
    }
  }
}
