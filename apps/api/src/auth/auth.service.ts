import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** Tặng điểm chào mừng khi tạo tài khoản mới. */
export const WELCOME_BONUS_POINTS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * UC-AUTH-01: Đăng ký tài khoản mới (POST /api/v1/auth/register)
   */
  async register(dto: RegisterDto) {
    const emailClean = dto.email.trim().toLowerCase();

    // Hệ thống chỉ chấp nhận duy nhất định dạng @gmail.com
    if (!emailClean.endsWith('@gmail.com') || emailClean.length <= 10) {
      throw new BadRequestException(
        'Hệ thống chỉ chấp nhận địa chỉ email có đuôi @gmail.com (Ví dụ: tenban@gmail.com).',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailClean },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: emailClean,
        passwordHash,
        role: 'CUSTOMER',
        // Tạo ví điểm kèm 10 điểm chào mừng trong cùng một lần ghi (nguyên tử với việc tạo user)
        loyalty: {
          create: {
            points: WELCOME_BONUS_POINTS,
            transactions: {
              create: { type: 'EARN', pointsAmount: WELCOME_BONUS_POINTS },
            },
          },
        },
      },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return {
      message: 'Đăng ký thành công',
      user: newUser,
    };
  }

  /**
   * UC-AUTH-02: Đăng nhập hệ thống & cấp phát JWT Access Token (POST /api/v1/auth/login)
   */
  async login(dto: LoginDto) {
    const emailClean = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: emailClean },
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    const payload = {
      sub: user.userId,
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '24h',
      algorithm: 'HS256',
    });

    return {
      accessToken,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * UC-AUTH-03: Đăng xuất hệ thống (POST /api/v1/auth/logout)
   */
  logout() {
    return {
      message: 'Đăng xuất thành công',
    };
  }

  /**
   * Lấy thông tin người dùng hiện tại (GET /api/v1/auth/me)
   * Hỗ trợ nhận trực tiếp userId (sau khi JwtAuthGuard xác thực) hoặc token JWT.
   */
  async getMe(userIdOrToken: string) {
    let userId = userIdOrToken;

    if (userIdOrToken && userIdOrToken.split('.').length === 3) {
      try {
        const payload = await this.jwtService.verifyAsync<{
          userId?: string;
          sub?: string;
        }>(userIdOrToken);
        userId = payload.userId || payload.sub || '';
      } catch {
        throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
      }
    }

    if (!userId) {
      throw new UnauthorizedException('Thông tin người dùng không hợp lệ');
    }

    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return user;
  }
}
