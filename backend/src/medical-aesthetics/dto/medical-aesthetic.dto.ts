import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const CreateMedicalAesthetiShema = z.object({
  category: z
    .enum(['skin', 'face', 'eyes', 'nose', 'lips', 'poster', 'other'])
    .describe('选择添加提示词部位'),
  label: z.string().min(1, { message: '需要填写选项' }),
  prompt: z.string().min(1, { message: '需要填写提示词' }),
  description: z.string().optional(),
});

const UpdateMedicalAesthetiShema = CreateMedicalAesthetiShema.partial();

export class CreateMedicalAestheticDto extends createZodDto(
  CreateMedicalAesthetiShema,
) {}

export class UpdateMedicalAestheticDto extends createZodDto(
  UpdateMedicalAesthetiShema,
) {}
