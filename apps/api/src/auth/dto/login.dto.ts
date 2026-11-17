import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'customer@brewlite.vn',
    description: 'Địa chỉ email đã đăng ký',
  })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mật khẩu tài khoản',
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(1, { message: 'Mật khẩu không được để trống' })
  password: string;
}
