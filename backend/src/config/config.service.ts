import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';
import type { StringValue } from 'ms';

/**
 * 封装的配置服务，提供类型安全的配置访问
 */
@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: NestConfigService<
      EnvironmentVariables,
      true
    >,
  ) {}

  // 应用配置
  get nodeEnv(): string {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // 数据库配置
  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  // JWT 配置
  get jwtSecret(): string {
    return this.configService.get('JWT_SECRET', { infer: true });
  }

  get jwtExpiresIn(): StringValue {
    return this.configService.get('JWT_EXPIRES_IN', { infer: true });
  }

  // S3/OSS 配置
  get s3Config() {
    return {
      endpoint: this.configService.get('S3_ENDPOINT', { infer: true }),
      bucket: this.configService.get('S3_BUCKET', { infer: true }),
      region: this.configService.get('AWS_REGION', { infer: true }),
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', { infer: true }),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', {
        infer: true,
      }),
    };
  }

  // Redis 配置
  get redisConfig() {
    return {
      host: this.configService.get('REDIS_HOST', { infer: true }),
      port: this.configService.get('REDIS_PORT', { infer: true }),
      password: this.configService.get('REDIS_PASSWORD', { infer: true }),
      db: this.configService.get('REDIS_DB', { infer: true }),
    };
  }
}
