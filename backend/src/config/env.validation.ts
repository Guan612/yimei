import { z } from 'zod';

// 定义环境枚举
const NodeEnvSchema = z.enum([
  'development',
  'production',
  'test',
  'provision',
]);

// 定义环境变量 Schema
const EnvironmentVariablesSchema = z.object({
  // Node 环境
  NODE_ENV: NodeEnvSchema.default('development'),

  // 应用端口
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0).max(65535)),

  // 数据库配置
  DATABASE_URL: z.url('DATABASE_URL 必须是有效的数据库连接字符串'),

  // JWT 配置
  JWT_SECRET: z.string().min(10, 'JWT_SECRET 至少需要 10 个字符'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // S3/OSS 配置
  S3_ENDPOINT: z.url('S3_ENDPOINT 必须是有效的 URL'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET 不能为空'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID 不能为空'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY 不能为空'),

  // Redis 配置
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .default('6379')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z
    .string()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0).max(15)),
});

// 导出类型
export type EnvironmentVariables = z.infer<typeof EnvironmentVariablesSchema>;

/**
 * 验证环境变量
 * @param config 原始配置对象
 * @returns 验证并转换后的配置对象
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const result = EnvironmentVariablesSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((issue) => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
      })
      .join('\n');

    throw new Error(`环境变量验证失败:\n${errorMessages}`);
  }

  return result.data;
}
