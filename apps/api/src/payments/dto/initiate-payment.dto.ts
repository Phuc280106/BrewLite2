import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({
    example: 'c6a96714-952e-43a5-a7c9-9844368444a2',
    description: 'UUID đơn hàng đang ở trạng thái PENDING',
  })
  @IsUUID('4', { message: 'orderId phải là UUID hợp lệ' })
  orderId!: string;

  @ApiPropertyOptional({
    example: 'VNBANK',
    description:
      'Mở sẵn tab trên VNPay: VNPAYQR (quét QR), VNBANK (thẻ ATM nội địa), INTCARD (thẻ quốc tế). Bỏ trống để khách tự chọn tại cổng.',
  })
  @IsOptional()
  @IsString()
  bankCode?: string;
}
