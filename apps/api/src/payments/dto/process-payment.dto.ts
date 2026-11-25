import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

export enum PaymentMethod {
  MOCK_CARD = 'MOCK_CARD',
  MOCK_WALLET = 'MOCK_WALLET',
}

export class ProcessPaymentDto {
  @ApiProperty({
    example: 'c6a96714-952e-43a5-a7c9-9844368444a2',
    description: 'UUID đơn hàng đang ở trạng thái PENDING',
  })
  @IsUUID('4', { message: 'orderId phải là UUID hợp lệ' })
  orderId!: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.MOCK_CARD,
    description: 'Phương thức thanh toán giả lập: thẻ hoặc ví điện tử',
  })
  @IsEnum(PaymentMethod, {
    message: 'method phải là MOCK_CARD hoặc MOCK_WALLET',
  })
  method!: PaymentMethod;
}
