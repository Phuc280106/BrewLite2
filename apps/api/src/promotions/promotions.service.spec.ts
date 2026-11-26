import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from './promotions.service';

describe('PromotionsService', () => {
  let service: PromotionsService;

  const mockPrisma = {
    promotion: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
  });

  it('should return promotions ordered by minimumOrderAmount with numeric Decimal fields', async () => {
    mockPrisma.promotion.findMany.mockResolvedValue([
      {
        promotionId: 'promo-1',
        promotionCode: 'BREWLITE10',
        description: 'Giảm 10% cho đơn từ 50.000đ',
        minimumOrderAmount: '50000.00',
        discountAmount: '0.00',
        discountPercentage: 10,
      },
      {
        promotionId: 'promo-2',
        promotionCode: 'GIAM15K',
        description: null,
        minimumOrderAmount: '80000.00',
        discountAmount: '15000.00',
        discountPercentage: 0,
      },
    ]);

    const result = await service.findAll();

    expect(mockPrisma.promotion.findMany).toHaveBeenCalledWith({
      orderBy: { minimumOrderAmount: 'asc' },
      select: {
        promotionId: true,
        promotionCode: true,
        description: true,
        minimumOrderAmount: true,
        discountAmount: true,
        discountPercentage: true,
      },
    });
    expect(result).toEqual([
      {
        promotionId: 'promo-1',
        promotionCode: 'BREWLITE10',
        description: 'Giảm 10% cho đơn từ 50.000đ',
        minimumOrderAmount: 50000,
        discountAmount: 0,
        discountPercentage: 10,
      },
      {
        promotionId: 'promo-2',
        promotionCode: 'GIAM15K',
        description: '',
        minimumOrderAmount: 80000,
        discountAmount: 15000,
        discountPercentage: 0,
      },
    ]);
  });

  it('should return an empty array when no promotions exist', async () => {
    mockPrisma.promotion.findMany.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });
});
