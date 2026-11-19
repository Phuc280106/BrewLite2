import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { LoyaltyService } from './loyalty.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;
  const mockPrisma = { loyalty: { findUnique: jest.fn() } };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [LoyaltyService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(LoyaltyService);
  });

  it('trả về số dư điểm hiện có', async () => {
    mockPrisma.loyalty.findUnique.mockResolvedValue({ points: 123 });
    expect(await service.getPoints('user-1')).toBe(123);
    expect(mockPrisma.loyalty.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { points: true },
    });
  });

  it('chưa có ví điểm thì trả 0', async () => {
    mockPrisma.loyalty.findUnique.mockResolvedValue(null);
    expect(await service.getPoints('user-1')).toBe(0);
  });
});
