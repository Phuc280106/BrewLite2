import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'Trạng thái mới cần chuyển đổi cho đơn hàng',
    example: OrderStatus.PREPARING,
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(OrderStatus, {
    message:
      'Trạng thái không hợp lệ. Các giá trị hợp lệ: PENDING, PAID, PREPARING, READY, COMPLETED, CANCELLED, PAYMENT_FAILED',
  })
  status!: OrderStatus;
}
