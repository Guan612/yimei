import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    loginId: 'testuser',
    password: '$2a$10$hashedPassword',
    nickname: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updateArt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: vi.fn(),
              create: vi.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: vi.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      loginId: 'newuser',
      password: 'password123',
      nickname: 'New User',
    };

    it('should successfully register a new user', async () => {
      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      vi.spyOn(prismaService.user, 'create').mockResolvedValue({
        ...mockUser,
        loginId: registerDto.loginId,
        nickname: registerDto.nickname,
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.loginId).toBe(registerDto.loginId);
      expect(result.token).toBe('mock-jwt-token');
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { loginId: registerDto.loginId },
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        '该账号已被注册',
      );
    });

    it('should use loginId as nickname if nickname is not provided', async () => {
      const dtoWithoutNickname = {
        loginId: 'newuser',
        password: 'password123',
      };

      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
      vi.spyOn(prismaService.user, 'create').mockResolvedValue({
        ...mockUser,
        loginId: dtoWithoutNickname.loginId,
        nickname: dtoWithoutNickname.loginId,
      });

      const result = await service.register(dtoWithoutNickname as RegisterDto);

      expect(result.user.nickname).toBe(dtoWithoutNickname.loginId);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      loginId: 'testuser',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('loginId');
      expect(result).toHaveProperty('token');
      expect(result.loginId).toBe(mockUser.loginId);
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('账号或密码错误');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('账号或密码错误');
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid userId', async () => {
      const expectedUser = {
        id: mockUser.id,
        loginId: mockUser.loginId,
        nickname: mockUser.nickname,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
      };

      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(
        expectedUser as any,
      );

      const result = await service.validateUser(mockUser.id);

      expect(result).toEqual(expectedUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: {
          id: true,
          loginId: true,
          nickname: true,
          role: true,
          createdAt: true,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.validateUser(999)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser(999)).rejects.toThrow('用户不存在');
    });
  });
});
