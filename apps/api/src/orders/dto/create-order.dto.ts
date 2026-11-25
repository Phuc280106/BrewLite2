import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @ApiProperty({ example: 'c6a96714-952e-43a5-a7c9-9844368444a2', description: 'UUID sản phẩm' })
  @IsUUID('4', { message: 'productId phải là UUID hợp lệ' })
  productId!: string;

  @ApiProperty({ example: 'cbaa0b62-e0e8-4470-997e-d8381c0a47e0', description: 'UUID kích cỡ (M/L)' })
  @IsUUID('4', { message: 'sizeId phải là UUID hợp lệ' })
  sizeId!: string;

  @ApiProperty({ example: 2, minimum: 1, description: 'Số lượng món' })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi món tối thiểu là 1' })
  quantity!: number;

  @ApiPropertyOptional({
    type: [String],
    example: [],
    description: 'Danh sách UUID topping thêm (tùy chọn)',
  })
  @IsOptional()
  @IsArray({ message: 'toppingIds phải là mảng' })
  @IsUUID('4', { each: true, message: 'Mỗi toppingId phải là UUID hợp lệ' })
  toppingIds?: string[];

  @ApiPropertyOptional({ example: '50%', description: 'Mức đường (tùy chọn)' })
  @IsOptional()
  @IsString({ message: 'Mức đường phải là chuỗi' })
  @MaxLength(30, { message: 'Mức đường tối đa 30 ký tự' })
  sugarLevel?: string;

  @ApiPropertyOptional({ example: '50% đá', description: 'Mức đá (tùy chọn)' })
  @IsOptional()
  @IsString({ message: 'Mức đá phải là chuỗi' })
  @MaxLength(30, { message: 'Mức đá tối đa 30 ký tự' })
  iceLevel?: string;

  @ApiPropertyOptional({ example: 'Ít ngọt, không lấy ống hút', description: 'Ghi chú pha chế (tối đa 150 ký tự)' })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  @MaxLength(150, { message: 'Ghi chú tối đa 150 ký tự' })
  note?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemInputDto], description: 'Danh sách các món đặt' })
  @IsArray({ message: 'Danh sách món đặt phải là mảng' })
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 món' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @ApiPropertyOptional({
    enum: ['TAKEAWAY', 'DINE_IN'],
    example: 'TAKEAWAY',
    description: 'Hình thức nhận hàng: TAKEAWAY (Mang đi) hoặc DINE_IN (Tại quán)',
  })
  @IsOptional()
  @IsIn(['TAKEAWAY', 'DINE_IN'], {
    message: 'pickupMethod phải là TAKEAWAY hoặc DINE_IN',
  })
  pickupMethod?: 'TAKEAWAY' | 'DINE_IN';

  @ApiPropertyOptional({ example: 'BREWLITE10', description: 'Mã khuyến mãi (tùy chọn)' })
  @IsOptional()
  @IsString({ message: 'Mã khuyến mãi phải là chuỗi' })
  promotionCode?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0, description: 'Số điểm thưởng muốn đổi (tùy chọn)' })
  @IsOptional()
  @IsInt({ message: 'Số điểm muốn đổi phải là số nguyên' })
  @Min(0, { message: 'Số điểm muốn đổi không được âm' })
  pointsToRedeem?: number;
}
