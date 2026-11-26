import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentsService } from './payments.service';

interface JwtPayloadUser {
  userId?: string;
  sub?: string;
}

/** vnp_IpAddr: bỏ tiền tố IPv4-mapped (::ffff:) và đổi ::1 về 127.0.0.1. */
function resolveClientIp(req: Request): string {
  const forwarded = (req.headers['x-forwarded-for'] as string | undefined)
    ?.split(',')[0]
    ?.trim();
  const raw = forwarded || req.socket?.remoteAddress || '127.0.0.1';
  if (raw === '::1') return '127.0.0.1';
  return raw.replace(/^::ffff:/, '');
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /api/v1/payments/initiate (FR-06: sinh URL thanh toán VNPay Sandbox)
  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Khởi tạo phiên thanh toán VNPay Sandbox cho đơn PENDING (trả về paymentUrl)',
  })
  initiatePayment(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: InitiatePaymentDto,
    @Req() req: Request,
  ) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return this.paymentsService.initiatePayment(userId, dto, resolveClientIp(req));
  }

  // GET /api/v1/payments/vnpay/return (không cần JWT: được xác thực bằng chữ ký HMAC-SHA512 của VNPay)
  @Get('vnpay/return')
  @ApiOperation({
    summary: 'Xác minh chữ ký & kết quả giao dịch khi VNPay redirect về ReturnUrl',
  })
  handleVnpayReturn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVnpayReturn(query);
  }
}
