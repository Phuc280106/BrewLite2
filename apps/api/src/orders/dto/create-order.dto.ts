import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @IsUUID('4', { message: 'productId phải là UUID hợp lệ' })
  productId: string;

  @IsUUID('4', { message: 'sizeId phải là UUID hợp lệ' })
  sizeId: string;

  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng mỗi món tối thiểu là 1' })
  quantity: number;

  @IsOptional()
  @IsArray({ message: 'toppingIds phải là mảng' })
  @IsUUID('4', { each: true, message: 'Mỗi toppingId phải là UUID hợp lệ' })
  toppingIds?: string[];
}

export class CreateOrderDto {
  @IsArray({ message: 'Danh sách món đặt phải là mảng' })
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 món' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsOptional()
  @IsString({ message: 'Mã khuyến mãi phải là chuỗi' })
  promotionCode?: string;

  @IsOptional()
  @IsInt({ message: 'Số điểm muốn đổi phải là số nguyên' })
  @Min(0, { message: 'Số điểm muốn đổi không được âm' })
  pointsToRedeem?: number;

  // Tạm thời cho phép truyền userId khi AuthModule (JWT) chưa tích hợp
  @IsOptional()
  @IsUUID('4', { message: 'userId phải là UUID hợp lệ' })
  userId?: string;
}
