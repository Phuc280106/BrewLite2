import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Số dư điểm thưởng hiện tại của khách (chưa có ví điểm = 0). */
  async getPoints(userId: string): Promise<number> {
    const loyalty = await this.prisma.loyalty.findUnique({
      where: { userId },
      select: { points: true },
    });
    return loyalty?.points ?? 0;
  }
}
