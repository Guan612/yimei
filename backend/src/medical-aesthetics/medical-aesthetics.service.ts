import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CreateMedicalAestheticDto,
  UpdateMedicalAestheticDto,
} from './dto/medical-aesthetic.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { success } from 'src/common/result';

@Injectable()
export class MedicalAestheticsService {
  constructor(private prisma: PrismaService) {}

  async createPrompt(
    createMedicalAestheticDto: CreateMedicalAestheticDto,
    userId: number,
  ) {
    const res = await this.prisma.medicalAesthetics.create({
      data: {
        ...createMedicalAestheticDto,
        userId,
        type: 'sys',
      },
    });

    return res;
  }

  async findAll(query?: { category?: string }) {
    const category = query?.category;

    // 兜底处理：防止 category 是 "" 或 "undefined"
    const normalizedCategory =
      category && category !== 'undefined' ? category : undefined;

    return this.prisma.medicalAesthetics.findMany({
      where: normalizedCategory ? { category: normalizedCategory } : undefined,
      orderBy: { id: 'desc' }, // 你可以按需改
    });
  }

  async findOne(id: number) {
    const res = await this.prisma.medicalAesthetics.findUnique({
      where: { id: id },
    });

    return res;
  }

  async update(
    id: number,
    updateMedicalAestheticDto: UpdateMedicalAestheticDto,
  ) {
    const existing = await this.prisma.medicalAesthetics.findUnique({
      where: { id: id },
    });

    if (!existing) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    const res = await this.prisma.medicalAesthetics.update({
      where: { id: id },
      data: updateMedicalAestheticDto,
    });

    return res;
  }

  async remove(id: number) {
    const existing = await this.prisma.medicalAesthetics.findUnique({
      where: { id: id },
    });

    if (!existing) {
      throw new NotFoundException(`未找到ID为 ${id} 的配置`);
    }

    await this.prisma.medicalAesthetics.delete({
      where: { id },
    });
  }

  // 用户个人提示词管理
  async createUserPrompt(
    createMedicalAestheticDto: CreateMedicalAestheticDto,
    userId: number,
  ) {
    const res = await this.prisma.medicalAesthetics.create({
      data: {
        ...createMedicalAestheticDto,
        userId,
        type: 'user',
      },
    });

    return res;
  }

  async findUserPrompts(userId: number, page: number = 1, pageSize: number = 10) {
    const result = await this.prisma.paginate(this.prisma.medicalAesthetics, {
      where: { userId },
      page,
      pageSize,
      orderBy: { id: 'desc' },
    });
    return success('获取个人提示词成功', result);
  }

  async updateUserPrompt(
    id: number,
    userId: number,
    updateMedicalAestheticDto: UpdateMedicalAestheticDto,
  ) {
    const existing = await this.prisma.medicalAesthetics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`未找到ID为 ${id} 的提示词`);
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('无权修改此提示词');
    }

    const res = await this.prisma.medicalAesthetics.update({
      where: { id },
      data: updateMedicalAestheticDto,
    });

    return res;
  }

  async removeUserPrompt(id: number, userId: number) {
    const existing = await this.prisma.medicalAesthetics.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`未找到ID为 ${id} 的提示词`);
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('无权删除此提示词');
    }

    await this.prisma.medicalAesthetics.delete({
      where: { id },
    });
  }
}
