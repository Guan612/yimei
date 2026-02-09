import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  imageUrls: z.array(z.string().url()).optional(),
});

const SendMessageSchema = z.object({
  message: z.string().min(1, { message: '消息不能为空' }).describe('用户消息'),
  context: z
    .enum(['facesim', 'poster', 'general'])
    .optional()
    .default('general')
    .describe('对话场景'),
  history: z
    .array(ChatMessageSchema)
    .optional()
    .default([])
    .describe('对话历史'),
  imageUrls: z
    .array(z.string().url())
    .optional()
    .default([])
    .describe('用户上传的图片 URL 列表'),
});

export class SendMessageDto extends createZodDto(SendMessageSchema) {}
