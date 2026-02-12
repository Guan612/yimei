import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, TokenDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    loginId: 'testuser',
    nickname: 'Test User',
    role: 'USER' as const,
  };

  const mockAuthService = {
    register: vi.fn(),
    login: vi.fn(),
    validateUser: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // 重置所有 mock
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      loginId: 'newuser',
      password: 'password123',
      nickname: 'New User',
    };

    it('should register a new user successfully', async () => {
      const mockResponse = {
        user: mockUser,
        token: 'mock-jwt-token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        code: 200,
        message: '注册成功',
        data: mockResponse,
      });
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    it('should handle registration errors', async () => {
      const error = new Error('该账号已被注册');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(error);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      loginId: 'testuser',
      password: 'password123',
    };

    it('should login a user successfully', async () => {
      const mockResponse = {
        ...mockUser,
        token: 'mock-jwt-token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual({
        code: 200,
        message: '登录成功',
        data: mockResponse,
      });
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should handle login errors', async () => {
      const error = new Error('账号或密码错误');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(error);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    const userToken: TokenDto = {
      id: 1,
      loginId: 'testuser',
      role: 'USER',
    };

    it('should get user profile successfully', async () => {
      const mockProfile = {
        id: mockUser.id,
        loginId: mockUser.loginId,
        nickname: mockUser.nickname,
        role: mockUser.role,
        createdAt: new Date(),
      };

      mockAuthService.validateUser.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(userToken);

      expect(result).toEqual({
        code: 200,
        message: '获取成功',
        data: mockProfile,
      });
      expect(authService.validateUser).toHaveBeenCalledWith(userToken.id);
      expect(authService.validateUser).toHaveBeenCalledTimes(1);
    });

    it('should handle profile retrieval errors', async () => {
      const error = new Error('用户不存在');
      mockAuthService.validateUser.mockRejectedValue(error);

      await expect(controller.getProfile(userToken)).rejects.toThrow(error);
      expect(authService.validateUser).toHaveBeenCalledWith(userToken.id);
    });
  });
});
