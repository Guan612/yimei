import { createZodDto } from 'nestjs-zod';
import z from 'zod';

// 允许的文件类型白名单
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/webm',
] as const;

// 最大文件大小：50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const CrateuploadSchema = z.object({
  contentType: z.enum(ALLOWED_CONTENT_TYPES, {
    message: `文件类型不支持，仅支持: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
  }),
});

export class CreateUploadDto extends createZodDto(CrateuploadSchema) {}

// 确认上传成功的DTO
const ConfirmUploadSchema = z.object({
  fileId: z.number().int().positive({ message: '文件ID必须是正整数' }),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE, { message: `文件大小不能超过${MAX_FILE_SIZE / 1024 / 1024}MB` })
    .optional(),
});

export class ConfirmUploadDto extends createZodDto(ConfirmUploadSchema) {}

// 批量获取文件URL的DTO
const BatchGetUrlsSchema = z.object({
  fileIds: z
    .array(z.number().int().positive({ message: '文件ID必须是正整数' }))
    .min(1, { message: '至少需要提供一个文件ID' })
    .max(100, { message: '单次最多获取100个文件URL' }),
  expiresIn: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('URL过期时间（秒），默认1小时'),
});

export class BatchGetUrlsDto extends createZodDto(BatchGetUrlsSchema) {}

export class UpdateUploadDto {}
