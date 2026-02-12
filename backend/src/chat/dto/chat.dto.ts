import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  imageUrls: z.array(z.url()).optional(),
});

const SendMessageSchema = z.object({
  message: z.string().min(1, { message: '消息不能为空' }).describe('用户消息'),
  sessionId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('会话ID，如果不传则创建新会话'),
  context: z
    .enum(['facesim', 'poster', 'general'])
    .optional()
    .default('general')
    .describe('对话场景'),
  history: z
    .array(ChatMessageSchema)
    .optional()
    .default([])
    .describe('对话历史（仅在不使用sessionId时有效）'),
  imageUrls: z
    .array(z.url())
    .optional()
    .default([])
    .describe('用户上传的图片 URL 列表'),
});

export class SendMessageDto extends createZodDto(SendMessageSchema) {}

// 创建会话 DTO
const CreateSessionSchema = z.object({
  title: z.string().optional().describe('会话标题'),
  context: z
    .enum(['facesim', 'poster', 'general'])
    .optional()
    .default('general')
    .describe('对话场景'),
});

export class CreateSessionDto extends createZodDto(CreateSessionSchema) {}

// 更新会话 DTO
const UpdateSessionSchema = z.object({
  title: z.string().optional().describe('会话标题'),
});

export class UpdateSessionDto extends createZodDto(UpdateSessionSchema) {}
