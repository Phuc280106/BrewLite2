import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'customer@gmail.com',
    description: 'Địa chỉ email Gmail đã đăng ký (@gmail.com)',
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
