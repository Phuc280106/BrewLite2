import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

jest.mock('@nestjs/jwt', () => {
  return {
    JwtService: class MockJwtService {
      verifyAsync = jest.fn();
    },
  };
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard, JwtService],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  const createMockContext = (authHeader?: string) => {
    const request = {
      headers: authHeader !== undefined ? { authorization: authHeader } : {},
      user: undefined as any,
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    return { context, request };
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should pass and attach user payload when valid Bearer token is provided', async () => {
    const payload = { sub: 'user-1', email: 'test@example.com', role: 'CUSTOMER' };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

    const { context, request } = createMockContext('Bearer valid-jwt-token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt-token');
    expect(request.user).toEqual(payload);
  });

  it('should throw UnauthorizedException when authorization header is missing', async () => {
    const { context } = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authorization header is missing'),
    );
  });

  it('should throw UnauthorizedException when authorization header is malformed (not Bearer)', async () => {
    const { context } = createMockContext('Basic dXNlcjpwYXNz');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authorization header is malformed'),
    );
  });

  it('should throw UnauthorizedException when Bearer token is empty', async () => {
    const { context } = createMockContext('Bearer ');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Authorization header is malformed'),
    );
  });

  it('should throw UnauthorizedException when token verification fails or is expired', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('jwt expired'));

    const { context } = createMockContext('Bearer expired-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn'),
    );
  });
});
