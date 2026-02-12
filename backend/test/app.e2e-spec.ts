import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { UploadModule } from '../src/upload/upload.module';
import { ImageGenModule } from '../src/image-gen/image-gen.module';
import { MedicalAestheticsModule } from '../src/medical-aesthetics/medical-aesthetics.module';
import { ChatModule } from '../src/chat/chat.module';
import { AiProviderModule } from '../src/ai-provider/ai-provider.module';
import { QueueModule } from '../src/queue/queue.module';
import { AppConfigModule } from '../src/config/config.module';
import { ModelconfigModule } from '../src/modelconfig/modelconfig.module';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { ZodExceptionFilter } from '../src/common/filters/zod-exception.filter';
import { validate } from '../src/config/env.validation';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Mock AppConfigService
const mockAppConfigService = {
  get nodeEnv() { return 'test'; },
  get port() { return 0; },
  get isDevelopment() { return false; },
  get isProduction() { return false; },
  get databaseUrl() { return 'postgresql://test:test@localhost:5432/test'; },
  get jwtSecret() { return 'test-secret-key-for-jwt'; },
  get jwtExpiresIn() { return '7d'; },
  get s3Config() {
    return {
      endpoint: 'http://localhost:9000',
      bucket: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    };
  },
  get redisConfig() {
    return {
      host: 'localhost',
      port: 6379,
      password: '',
      db: 0,
    };
  },
};

// 在导入任何模块之前设置环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jwt';
process.env.JWT_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '0';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = '';
process.env.REDIS_DB = '0';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

describe('App (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: number;

  // 测试用户信息
  const testUser = {
    loginId: `test_${Date.now()}@example.com`,
    password: 'Test123456',
    nickname: 'Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validate: () => ({
            NODE_ENV: 'test',
            PORT: 0,
            DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
            JWT_SECRET: 'test-secret-key-for-jwt',
            JWT_EXPIRES_IN: '7d',
            S3_ENDPOINT: 'http://localhost:9000',
            S3_BUCKET: 'test-bucket',
            AWS_REGION: 'us-east-1',
            AWS_ACCESS_KEY_ID: 'test-key',
            AWS_SECRET_ACCESS_KEY: 'test-secret',
            REDIS_HOST: 'localhost',
            REDIS_PORT: 6379,
            REDIS_PASSWORD: '',
            REDIS_DB: 0,
          } as any),
          expandVariables: true,
        }),
        EventEmitterModule.forRoot({
          wildcard: false,
          delimiter: '.',
          maxListeners: 20,
        }),
        QueueModule,
        AppConfigModule,
        AiProviderModule,
        AuthModule,
        PrismaModule,
        UploadModule,
        ModelconfigModule,
        ImageGenModule,
        MedicalAestheticsModule,
        ChatModule,
        ScheduleModule.forRoot(),
      ],
      controllers: [],
      providers: [
        {
          provide: APP_PIPE,
          useClass: ZodValidationPipe,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: ZodSerializerInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: ZodExceptionFilter,
        },
      ],
    })
      .overrideProvider(AppConfigModule)
      .useValue({
        providers: [
          {
            provide: 'AppConfigService',
            useValue: mockAppConfigService,
          },
        ],
      } as any)
      .compile();

    app = moduleFixture.createNestApplication();

    // 应用全局管道（与实际应用保持一致）
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET) should return 404', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(404);
    });
  });

  describe('Authentication Flow', () => {
    describe('POST /auth/register', () => {
      it('should register a new user successfully', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('code', 200);
            expect(res.body).toHaveProperty('message', '注册成功');
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user).toHaveProperty('id');
            expect(res.body.data.user.loginId).toBe(testUser.loginId);

            // 保存 token 和 userId 供后续测试使用
            authToken = res.body.data.token;
            testUserId = res.body.data.user.id;
          });
      });

      it('should fail when registering with existing loginId', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(409)
          .expect((res) => {
            expect(res.body.message).toContain('该账号已被注册');
          });
      });

      it('should fail when required fields are missing', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            loginId: 'test@example.com',
            // 缺少 password
          })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      it('should login successfully with correct credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            loginId: testUser.loginId,
            password: testUser.password,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('code', 200);
            expect(res.body).toHaveProperty('message', '登录成功');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.loginId).toBe(testUser.loginId);
          });
      });

      it('should fail with incorrect password', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            loginId: testUser.loginId,
            password: 'WrongPassword123',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('账号或密码错误');
          });
      });

      it('should fail with non-existent user', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            loginId: 'nonexistent@example.com',
            password: 'password123',
          })
          .expect(401)
          .expect((res) => {
            expect(res.body.message).toContain('账号或密码错误');
          });
      });
    });

    describe('GET /auth/profile', () => {
      it('should get user profile with valid token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('code', 200);
            expect(res.body).toHaveProperty('message', '获取成功');
            expect(res.body.data).toHaveProperty('id', testUserId);
            expect(res.body.data).toHaveProperty('loginId', testUser.loginId);
            expect(res.body.data).toHaveProperty('nickname');
          });
      });

      it('should fail without authorization token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .expect(401);
      });

      it('should fail with invalid token', () => {
        return request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });
  });

  describe('Image Generation Flow', () => {
    describe('GET /image-gen/providers/list', () => {
      it('should get available providers list', () => {
        return request(app.getHttpServer())
          .get('/image-gen/providers/list')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('code', 200);
            expect(res.body).toHaveProperty('message', '获取Provider列表成功');
            expect(res.body.data).toBeInstanceOf(Array);
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .get('/image-gen/providers/list')
          .expect(401);
      });
    });

    describe('POST /image-gen/generate', () => {
      it('should submit image generation task', () => {
        return request(app.getHttpServer())
          .post('/image-gen/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            prompt: 'a beautiful sunset over the ocean',
            width: 1024,
            height: 1024,
          })
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('code', 200);
            expect(res.body).toHaveProperty('message', '图片生成任务已提交');
            expect(res.body.data).toHaveProperty('jobId');
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post('/image-gen/generate')
          .send({
            prompt: 'a beautiful sunset',
            width: 1024,
            height: 1024,
          })
          .expect(401);
      });

      it('should fail with invalid parameters', () => {
        return request(app.getHttpServer())
          .post('/image-gen/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            // 缺少必需的 prompt
            width: 1024,
            height: 1024,
          })
          .expect(400);
      });
    });

    describe('GET /image-gen/history', () => {
      it('should get user generation history', () => {
        return request(app.getHttpServer())
          .get('/image-gen/history')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 20, offset: 0 })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('code', 200);
            expect(res.body).toHaveProperty('message', '获取历史记录成功');
            expect(res.body.data).toBeInstanceOf(Array);
          });
      });

      it('should support pagination', () => {
        return request(app.getHttpServer())
          .get('/image-gen/history')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ limit: 10, offset: 5 })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('code', 200);
            expect(res.body.data).toBeInstanceOf(Array);
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .get('/image-gen/history')
          .expect(401);
      });
    });
  });
});
