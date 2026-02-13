import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { PaginationQuerySchema } from '../../common/dto/common.dto';

const createModelSchema = z.object({
  name: z.string().min(1, { message: '配置名称不能为空' }).describe('配置名称'),
  provider: z
    .enum(['stability', 'openai', 'aliyun', 'gemini'], {
      message: 'provider类型必须是stability/openai/aliyun/gemini之一',
    })
    .describe('Provider类型'),
  type: z
    .string()
    .default('image-gen')
    .describe('服务类型：image-gen, text-gen, embedding'),
  modelId: z.string().optional().describe('具体模型ID'),
  baseUrl: z
    .string()
    .url({ message: '必须是有效的URL格式' })
    .describe('API基础URL'),
  apiKey: z.string().min(1, { message: 'API Key不能为空' }).describe('API密钥'),
  config: z
    .record(z.string(), z.any())
    .optional()
    .describe('额外配置（JSON格式）'),
  enabled: z.boolean().default(true).describe('是否启用'),
  priority: z.number().int().default(0).describe('优先级，数字越大越优先'),
  description: z.string().optional().describe('描述信息'),
});

const updateModelSchema = createModelSchema.partial();

const queryModelSchema = PaginationQuerySchema.extend({
  provider: z.string().optional().describe('按Provider类型筛选'),
  type: z.string().optional().describe('按服务类型筛选'),
  enabled: z.boolean().optional().describe('按启用状态筛选'),
});

const validateConfigSchema = z.object({
  testPrompt: z.string().optional().describe('测试提示词（可选）'),
});

const costStatsSchema = z.object({
  startDate: z.string().optional().describe('开始时间（ISO 8601格式）'),
  endDate: z.string().optional().describe('结束时间（ISO 8601格式）'),
});

const rateLimitSchema = z.object({
  requestsPerMinute: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('每分钟请求限制'),
  requestsPerHour: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('每小时请求限制'),
  requestsPerDay: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('每天请求限制'),
});

const presetParamsSchema = z.object({
  presetName: z
    .string()
    .min(1, { message: '预设名称不能为空' })
    .describe('预设名称'),
  params: z.record(z.string(), z.any()).describe('预设参数'),
});

export class CreateModelconfigDto extends createZodDto(createModelSchema) {}

export class UpdateModelconfigDto extends createZodDto(updateModelSchema) {}

export class QueryModelconfigDto extends createZodDto(queryModelSchema) {}

export class ValidateConfigDto extends createZodDto(validateConfigSchema) {}

export class CostStatsDto extends createZodDto(costStatsSchema) {}

export class RateLimitConfigDto extends createZodDto(rateLimitSchema) {}

export class PresetParamsDto extends createZodDto(presetParamsSchema) {}
