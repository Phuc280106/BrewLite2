import { Controller, Get, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LoyaltyService } from './loyalty.service';

interface JwtPayloadUser {
  userId?: string;
  sub?: string;
}

@ApiTags('Loyalty')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // GET /api/v1/loyalty/me -> { points }
  @Get('me')
  @ApiOperation({ summary: 'Xem số dư điểm thưởng hiện tại của tôi' })
  async getMyPoints(@CurrentUser() user: JwtPayloadUser) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return { points: await this.loyaltyService.getPoints(userId) };
  }
}
