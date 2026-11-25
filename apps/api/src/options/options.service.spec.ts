import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OptionsService } from './options.service';

describe('OptionsService', () => {
  let service: OptionsService;

  const mockPrisma = {
    topping: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OptionsService>(OptionsService);
    jest.clearAllMocks();
  });

  describe('calculateToppingServings', () => {
    it('nên trả về isAvailable=true và maxServings tính theo stock / requiredAmount', () => {
      const result = service.calculateToppingServings({
        stock: 150,
        requiredAmount: 50,
      });
      expect(result).toEqual({ isAvailable: true, maxServings: 3 });
    });

    it('nên trả về isAvailable=false và maxServings=0 khi stock nhỏ hơn requiredAmount', () => {
      const result = service.calculateToppingServings({
        stock: 30,
        requiredAmount: 50,
      });
      expect(result).toEqual({ isAvailable: false, maxServings: 0 });
    });

    it('nên trả về isAvailable=false và maxServings=0 khi hết topping (stock = 0)', () => {
      const result = service.calculateToppingServings({
        stock: 0,
        requiredAmount: 50,
      });
      expect(result).toEqual({ isAvailable: false, maxServings: 0 });
    });
  });

  describe('findAll', () => {
    it('nên trả về danh sách topping kèm trạng thái tồn kho từ bảng toppings', async () => {
      mockPrisma.topping.findMany.mockResolvedValue([
        { toppingId: 'top-1', name: 'Trân châu đen', price: 5000, stock: 200, requiredAmount: 50 },
        { toppingId: 'top-2', name: 'Kem cheese', price: 10000, stock: 0, requiredAmount: 40 },
      ]);

      const result = await service.findAll();
      expect(result).toEqual([
        {
          toppingId: 'top-1',
          name: 'Trân châu đen',
          price: 5000,
          stock: 200,
          requiredAmount: 50,
          isAvailable: true,
          maxServings: 4,
        },
        {
          toppingId: 'top-2',
          name: 'Kem cheese',
          price: 10000,
          stock: 0,
          requiredAmount: 40,
          isAvailable: false,
          maxServings: 0,
        },
      ]);
    });
  });

  describe('findByToppingId', () => {
    it('nên trả về đúng một topping theo id', async () => {
      mockPrisma.topping.findUnique.mockResolvedValue({
        toppingId: 'top-1',
        name: 'Trân châu đen',
        price: 5000,
        stock: 100,
        requiredAmount: 50,
      });

      await expect(service.findByToppingId('top-1')).resolves.toEqual({
        toppingId: 'top-1',
        name: 'Trân châu đen',
        price: 5000,
        stock: 100,
        requiredAmount: 50,
        isAvailable: true,
        maxServings: 2,
      });
      expect(mockPrisma.topping.findUnique).toHaveBeenCalledWith({
        where: { toppingId: 'top-1' },
      });
      expect(mockPrisma.topping.findMany).not.toHaveBeenCalled();
    });

    it('nên ném NotFoundException nếu không tìm thấy topping', async () => {
      mockPrisma.topping.findUnique.mockResolvedValue(null);

      await expect(service.findByToppingId('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
