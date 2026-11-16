import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryProductDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  category?: string;
}
