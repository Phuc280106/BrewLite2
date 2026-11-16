import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Đang dọn dẹp và nạp lại dữ liệu mẫu cho Thực đơn BrewLite...');

  // 0. Xóa dữ liệu cũ để tránh lỗi trùng lặp khi chạy lại seed
  await prisma.recipeItems.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.size.deleteMany();
  await prisma.topping.deleteMany();

  // 1. Tạo các Danh mục mẫu chuẩn theo thiết kế Figma
  const caPhePhin = await prisma.category.create({
    data: {
      name: 'Cà phê pha phin',
      description: 'Cà phê pha phin truyền thống và máy nguyên chất',
    },
  });

  const traSua = await prisma.category.create({
    data: {
      name: 'Trà sữa',
      description: 'Trà đậm vị kết hợp sữa béo ngậy',
    },
  });

  const traTraiCay = await prisma.category.create({
    data: {
      name: 'Trà trái cây',
      description: 'Trà hoa quả tươi mát thanh nhiệt',
    },
  });

  const daXay = await prisma.category.create({
    data: {
      name: 'Đá xay',
      description: 'Thức uống đá xay nhuyễn mát lạnh phủ kem',
    },
  });

  const nuocEp = await prisma.category.create({
    data: {
      name: 'Nước ép',
      description: 'Nước ép trái cây tươi nguyên chất 100%',
    },
  });

  // 2. Tạo các Kích cỡ mẫu chuẩn theo thiết kế Figma (Size M, L)
  const sizeM = await prisma.size.create({
    data: { name: 'M (Vừa)', priceAdjustment: 0 },
  });
  const sizeL = await prisma.size.create({
    data: { name: 'L (Lớn)', priceAdjustment: 8000 },
  });

  // 3. Tạo các Topping mẫu chuẩn
  const topTranChau = await prisma.topping.create({
    data: { name: 'Trân châu đen', price: 5000 },
  });
  const topPudding = await prisma.topping.create({
    data: { name: 'Pudding trứng', price: 8000 },
  });
  const topKemCheese = await prisma.topping.create({
    data: { name: 'Kem cheese', price: 10000 },
  });

  // 4. Danh sách 10 món nước mẫu của Phước (khớp 100% với giao diện Figma)
  const sampleProducts = [
    {
      name: 'Trà Sữa Oolong Nướng',
      desc: 'Hương trà nướng, béo mịn',
      price: 38000,
      catId: traSua.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
    },
    {
      name: 'Cà Phê Muối Hoàng Gia',
      desc: 'Vị béo ngậy, đậm đà',
      price: 35000,
      catId: caPhePhin.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
    },
    {
      name: 'Trà Đào Cam Sả Thượng Hạng',
      desc: 'Hương sả thanh khiết kết hợp đào giòn ngọt',
      price: 39000,
      catId: traTraiCay.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80',
    },
    {
      name: 'Cà phê sữa đá',
      desc: 'Đậm đà hương vị cà phê phin truyền thống',
      price: 29000,
      catId: caPhePhin.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
    },
    {
      name: 'Americano đá',
      desc: 'Espresso pha loãng thanh nhẹ mát lạnh',
      price: 35000,
      catId: caPhePhin.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&q=80',
    },
    {
      name: 'Trà sữa trân châu',
      desc: 'Trà đen đậm đà kèm trân châu dai giòn thủ công',
      price: 35000,
      catId: traSua.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
    },
    {
      name: 'Trà vải lài',
      desc: 'Trà lài thanh khiết ướp hương vải mọng nước',
      price: 35000,
      catId: traTraiCay.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80',
    },
    {
      name: 'Chocolate đá xay',
      desc: 'Chocolate Bỉ xay cùng đá và whipped cream',
      price: 49000,
      catId: daXay.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80',
    },
    {
      name: 'Matcha đá xay',
      desc: 'Đá xay matcha thơm béo sảng khoái',
      price: 49000,
      catId: daXay.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
    },
    {
      name: 'Nước ép cam tươi',
      desc: 'Cam tươi vắt nguyên chất giàu vitamin C',
      price: 32000,
      catId: nuocEp.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80',
    },
  ];

  for (const item of sampleProducts) {
    await prisma.product.create({
      data: {
        name: item.name,
        description: item.desc,
        basePrice: item.price,
        imageUrl: item.imageUrl,
        categoryId: item.catId,
        sizes: {
          connect: [{ sizeId: sizeM.sizeId }, { sizeId: sizeL.sizeId }],
        },
        toppings: {
          connect: [
            { toppingId: topTranChau.toppingId },
            { toppingId: topPudding.toppingId },
            { toppingId: topKemCheese.toppingId },
          ],
        },
      },
    });
  }

  console.log('Đã nạp thành công 5 danh mục, 2 kích cỡ chuẩn Figma, 3 topping và 10 món nước mẫu của Phước!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
