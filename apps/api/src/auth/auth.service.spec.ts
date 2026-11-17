import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

jest.mock('@nestjs/jwt', () => {
  return {
    JwtService: class MockJwtService {
      signAsync = jest.fn();
      verifyAsync = jest.fn();
    },
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      name: 'Nguyen Van A',
      email: 'nguyenvana@example.com',
      password: 'password123',
    };

    it('should register a new user successfully with CUSTOMER role and hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        userId: 'uuid-user-1',
        name: registerDto.name,
        email: registerDto.email,
        role: 'CUSTOMER',
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const hashSpy = jest.spyOn(bcrypt, 'hash');

      const result = await service.register(registerDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(hashSpy).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          passwordHash: expect.any(String),
          role: 'CUSTOMER',
        },
        select: {
          userId: true,
          name: true,
          email: true,
          role: true,
        },
      });
      expect(result).toEqual({
        message: 'Đăng ký thành công',
        user: createdUser,
      });
    });

    it('should throw ConflictException if email is already in use (AC-04.2)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        userId: 'uuid-existing',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email này đã được sử dụng'),
      );
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'nguyenvana@example.com',
      password: 'password123',
    };

    const mockDbUser = {
      userId: 'uuid-user-1',
      name: 'Nguyen Van A',
      email: 'nguyenvana@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'CUSTOMER',
    };

    it('should login successfully and return access token and user info (AC-04.3)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      (jwtService.signAsync as jest.Mock).mockResolvedValue('mock-access-token-xyz');

      const result = await service.login(loginDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockDbUser.passwordHash);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockDbUser.userId,
          userId: mockDbUser.userId,
          email: mockDbUser.email,
          role: mockDbUser.role,
        },
        {
          expiresIn: '24h',
          algorithm: 'HS256',
        },
      );
      expect(result).toEqual({
        accessToken: 'mock-access-token-xyz',
        user: {
          userId: mockDbUser.userId,
          name: mockDbUser.name,
          email: mockDbUser.email,
          role: mockDbUser.role,
        },
      });
    });

    it('should throw UnauthorizedException if user does not exist (AC-04.4)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Thông tin đăng nhập không chính xác'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password does not match (AC-04.4)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Thông tin đăng nhập không chính xác'),
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should return logout success message (UC-AUTH-03)', () => {
      const result = service.logout();
      expect(result).toEqual({
        message: 'Đăng xuất thành công',
      });
    });
  });

  describe('getMe', () => {
    const mockUser = {
      userId: 'uuid-user-1',
      name: 'Nguyen Van A',
      email: 'nguyenvana@example.com',
      role: 'CUSTOMER',
    };

    it('should return user info when userId is provided directly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe('uuid-user-1');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { userId: 'uuid-user-1' },
        select: {
          userId: true,
          name: true,
          email: true,
          role: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return user info when valid JWT token string is provided', async () => {
      const validToken = 'part1.part2.part3';
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        userId: 'uuid-user-1',
      });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(validToken);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(validToken);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('jwt expired'));

      await expect(service.getMe('header.payload.signature')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user does not exist in database', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('uuid-user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
