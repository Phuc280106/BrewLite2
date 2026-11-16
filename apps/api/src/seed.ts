import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      { name: 'Trà Đào', price: 30000, category: 'Tea', imageUrl: '/images/tra-dao.png' },
      { name: 'Cà Phê Sữa', price: 35000, category: 'Coffee', imageUrl: '/images/ca-phe-sua.png' },
      { name: 'Sinh Tố Dâu', price: 40000, category: 'Smoothie', imageUrl: '/images/sinh-to-dau.png' },
      { name: 'Nước Dưỡng Đạm', price: 25000, category: 'Juice', imageUrl: '/images/nuoc-duong-dam.png' },
      { name: 'Trà Xanh', price: 28000, category: 'Tea', imageUrl: '/images/tra-xanh.png' },
      { name: 'Cappuccino', price: 38000, category: 'Coffee', imageUrl: '/images/cappuccino.png' },
      { name: 'Sinh Tố Xoài', price: 42000, category: 'Smoothie', imageUrl: '/images/sinh-to-xoai.png' },
      { name: 'Nước Cam', price: 26000, category: 'Juice', imageUrl: '/images/nuoc-cam.png' }
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
