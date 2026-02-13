import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from '../../common/dto/common.dto';

// 图像生成请求Schema
const GenerateImageSchema = z.object({
  prompt: z
    .string()
    .min(1, '提示词不能为空')
    .max(2000, '提示词不能超过2000字符'),
  promptInjectIds: z
    .array(z.number().int().positive())
    .max(20)
    .optional()
    .describe('从“提示词库”(medical_aesthetics)选择要注入的提示词ID列表'),
  promptInjectPosition: z
    .enum(['prepend', 'append'])
    .default('prepend')
    .describe('注入提示词的位置：prepend=前置，append=后置'),
  negativePrompt: z.string().max(2000).optional(),
  configId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('指定使用的Provider配置ID，优先级最高'),
  provider: z
    .enum(['stability', 'openai', 'aliyun', 'gemini', 'auto'])
    .default('auto')
    .describe('AI服务提供商类型，auto为自动选择'),
  width: z.number().int().min(256).max(2048).optional(),
  height: z.number().int().min(256).max(2048).optional(),
  aspectRatio: z
    .enum(['1:1', '16:9', '9:16', '4:3', '3:4'])
    .optional()
    .describe('宽高比'),
  style: z.string().optional().describe('风格预设'),
  steps: z
    .number()
    .int()
    .min(10)
    .max(150)
    .optional()
    .describe('生成步数，影响质量和速度'),
  cfgScale: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .describe('CFG比例，控制提示词遵循度'),
  seed: z.number().int().optional().describe('随机种子，用于复现结果'),
  samples: z.number().int().min(1).max(4).default(1).describe('生成图片数量'),
  model: z.string().optional().describe('指定使用的具体模型'),
  referenceImageUrl: z
    .string()
    .optional()
    .describe('参考图片URL，用于图生图场景（如facesim）'),
  referenceImageBase64: z
    .string()
    .optional()
    .describe('参考图片Base64数据，前端直接传入避免后端下载'),
  referenceImageMimeType: z
    .string()
    .optional()
    .describe('参考图片MIME类型，如image/jpeg'),
});

// Inpainting请求Schema
const InpaintImageSchema = z.object({
  imageId: z.number().int().positive().describe('原始图片文件ID'),
  maskId: z.number().int().positive().describe('遮罩图片文件ID'),
  prompt: z.string().min(1).max(2000).describe('修改描述'),
  promptInjectIds: z
    .array(z.number().int().positive())
    .max(20)
    .optional()
    .describe('从“提示词库”(medical_aesthetics)选择要注入的提示词ID列表'),
  promptInjectPosition: z
    .enum(['prepend', 'append'])
    .default('prepend')
    .describe('注入提示词的位置：prepend=前置，append=后置'),
  negativePrompt: z.string().max(2000).optional(),
  configId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('指定使用的Provider配置ID'),
  provider: z.enum(['stability', 'openai', 'gemini', 'auto']).default('auto'),
  strength: z.number().min(0).max(1).optional().describe('修改强度，0-1之间'),
  steps: z.number().int().min(10).max(150).optional(),
  cfgScale: z.number().min(1).max(20).optional(),
  seed: z.number().int().optional(),
});

// 使用nestjs-zod创建DTO类
export class GenerateImageDto extends createZodDto(GenerateImageSchema) {}
export class InpaintImageDto extends createZodDto(InpaintImageSchema) {}

// 导出响应类型
export const GenerateImageResponseSchema = z.object({
  id: z.number(),
  imageUrl: z.url(),
  provider: z.string(),
  configId: z.number(),
  model: z.string().optional(),
  createdAt: z.date(),
});

export class GenerateImageResponseDto extends createZodDto(
  GenerateImageResponseSchema,
) {}

// 图片生成历史查询参数（继承分页参数）
export class ImageGenerationHistoryQueryDto extends createZodDto(
  PaginationQuerySchema,
) {}
