import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { isUUID } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentsService } from './payments.service';

interface JwtPayloadUser {
  userId?: string;
  sub?: string;
}

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /api/v1/payments (FR-06: thanh toán mô phỏng & chống trùng lặp)
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thanh toán đơn hàng (mock) với Idempotency-Key' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    description: 'UUID v4 sinh ở client cho mỗi lượt thanh toán',
  })
  processPayment(
    @CurrentUser() user: JwtPayloadUser,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: ProcessPaymentDto,
  ) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    if (!idempotencyKey || !isUUID(idempotencyKey, '4')) {
      throw new BadRequestException(
        'Thiếu hoặc sai định dạng header Idempotency-Key (UUID v4)',
      );
    }
    return this.paymentsService.processPayment(userId, dto, idempotencyKey);
  }
}
