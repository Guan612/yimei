import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly appConfig: AppConfigService,
    private readonly s3: S3Client,
    private readonly prisma: PrismaService,
  ) {}

  async create(contentType: string, userId?: number) {
    const bucket = this.appConfig.s3Config.bucket;

    // 生成唯一的文件名
    const fileExtension = this.getFileExtension(contentType);
    const uniqueFileName = `${randomUUID()}${fileExtension}`;
    const key = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${uniqueFileName}`;

    // 创建数据库记录（状态为pending）
    const file = await this.prisma.file.create({
      data: {
        key,
        contentType,
        status: 'pending',
        userId,
      },
    });

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3, cmd, { expiresIn: 60 * 5 });

    return {
      fileId: file.id,
      key: key,
      url: url,
    };
  }

  // 确认上传成功
  async confirmUpload(fileId: number, userId: number, size?: number) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('文件记录不存在');
    }

    // 验证文件所有权
    if (file.userId && file.userId !== userId) {
      throw new ForbiddenException('无权操作此文件');
    }

    // 验证文件状态
    if (file.status !== 'pending') {
      throw new BadRequestException('文件已确认或已删除');
    }

    const updatedFile = await this.prisma.file.update({
      where: { id: fileId },
      data: {
        status: 'uploaded',
        size: size || file.size,
      },
    });

    return {
      fileId: updatedFile.id,
      key: updatedFile.key,
      status: updatedFile.status,
    };
  }

  // 获取文件访问URL（生成GET预签名URL）
  async getFileUrl(fileId: number, userId: number, expiresIn: number = 60 * 60) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('文件记录不存在');
    }

    if (file.status !== 'uploaded') {
      throw new UnauthorizedException('文件未上传或已删除');
    }

    // 验证文件所有权（如果文件有所有者）
    if (file.userId && file.userId !== userId) {
      throw new ForbiddenException('无权访问此文件');
    }

    // 限制过期时间最长为7天
    const maxExpiresIn = 7 * 24 * 60 * 60; // 7天
    const validExpiresIn = Math.min(Math.max(expiresIn, 60), maxExpiresIn);

    const bucket = this.appConfig.s3Config.bucket;

    const cmd = new GetObjectCommand({
      Bucket: bucket,
      Key: file.key,
    });

    const url = await getSignedUrl(this.s3, cmd, { expiresIn: validExpiresIn });

    return {
      fileId: file.id,
      key: file.key,
      url: url,
      contentType: file.contentType,
      size: file.size,
    };
  }

  // 管理员获取文件访问URL（跳过所有权验证）
  async getFileUrlAsAdmin(fileId: number, expiresIn: number = 60 * 60) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('文件记录不存在');
    }

    if (file.status !== 'uploaded') {
      throw new UnauthorizedException('文件未上传或已删除');
    }

    // 限制过期时间最长为7天
    const maxExpiresIn = 7 * 24 * 60 * 60; // 7天
    const validExpiresIn = Math.min(Math.max(expiresIn, 60), maxExpiresIn);

    const bucket = this.appConfig.s3Config.bucket;

    const cmd = new GetObjectCommand({
      Bucket: bucket,
      Key: file.key,
    });

    const url = await getSignedUrl(this.s3, cmd, { expiresIn: validExpiresIn });

    return {
      fileId: file.id,
      key: file.key,
      url: url,
      contentType: file.contentType,
      size: file.size,
    };
  }

  // 批量获取文件访问URL
  async getBatchFileUrls(
    fileIds: number[],
    userId: number,
    expiresIn: number = 60 * 60,
  ) {
    // 查询所有文件记录
    const files = await this.prisma.file.findMany({
      where: {
        id: { in: fileIds },
        status: 'uploaded',
      },
    });

    if (files.length === 0) {
      return [];
    }

    // 限制过期时间最长为7天
    const maxExpiresIn = 7 * 24 * 60 * 60; // 7天
    const validExpiresIn = Math.min(Math.max(expiresIn, 60), maxExpiresIn);

    const bucket = this.appConfig.s3Config.bucket;

    // 并行生成所有签名URL
    const urlPromises = files.map(async (file) => {
      // 验证文件所有权（如果文件有所有者且不是当前用户，则跳过）
      if (file.userId && file.userId !== userId) {
        return null; // 无权访问的文件返回null
      }

      try {
        const cmd = new GetObjectCommand({
          Bucket: bucket,
          Key: file.key,
        });

        const url = await getSignedUrl(this.s3, cmd, {
          expiresIn: validExpiresIn,
        });

        return {
          fileId: file.id,
          key: file.key,
          url: url,
          contentType: file.contentType,
          size: file.size,
        };
      } catch (error) {
        // 如果某个文件生成URL失败，记录错误但不影响其他文件
        console.error(`生成文件 ${file.id} 的URL失败:`, error);
        return null;
      }
    });

    const results = await Promise.all(urlPromises);

    // 过滤掉null值（无权访问或生成失败的文件）
    return results.filter((result) => result !== null);
  }

  // 管理员批量获取文件访问URL（跳过所有权验证）
  async getBatchFileUrlsAsAdmin(
    fileIds: number[],
    expiresIn: number = 60 * 60,
  ) {
    // 查询所有文件记录
    const files = await this.prisma.file.findMany({
      where: {
        id: { in: fileIds },
        status: 'uploaded',
      },
    });

    if (files.length === 0) {
      return [];
    }

    // 限制过期时间最长为7天
    const maxExpiresIn = 7 * 24 * 60 * 60; // 7天
    const validExpiresIn = Math.min(Math.max(expiresIn, 60), maxExpiresIn);

    const bucket = this.appConfig.s3Config.bucket;

    // 并行生成所有签名URL
    const urlPromises = files.map(async (file) => {
      try {
        const cmd = new GetObjectCommand({
          Bucket: bucket,
          Key: file.key,
        });

        const url = await getSignedUrl(this.s3, cmd, {
          expiresIn: validExpiresIn,
        });

        return {
          fileId: file.id,
          key: file.key,
          url: url,
          contentType: file.contentType,
          size: file.size,
        };
      } catch (error) {
        // 如果某个文件生成URL失败，记录错误但不影响其他文件
        console.error(`生成文件 ${file.id} 的URL失败:`, error);
        return null;
      }
    });

    const results = await Promise.all(urlPromises);

    // 过滤掉null值（生成失败的文件）
    return results.filter((result) => result !== null);
  }

  // 根据key获取文件访问URL
  async getFileUrlByKey(key: string, userId: number, expiresIn: number = 60 * 60) {
    // 验证key格式，防止路径遍历攻击
    if (!key || key.includes('..') || !key.match(/^(uploads|generated)\//)) {
      throw new BadRequestException('无效的文件路径');
    }

    const file = await this.prisma.file.findUnique({
      where: { key },
    });

    if (!file) {
      throw new NotFoundException('文件记录不存在');
    }

    if (file.status !== 'uploaded') {
      throw new UnauthorizedException('文件未上传或已删除');
    }

    // 验证文件所有权（如果文件有所有者）
    if (file.userId && file.userId !== userId) {
      throw new ForbiddenException('无权访问此文件');
    }

    // 限制过期时间最长为7天
    const maxExpiresIn = 7 * 24 * 60 * 60; // 7天
    const validExpiresIn = Math.min(Math.max(expiresIn, 60), maxExpiresIn);

    const bucket = this.appConfig.s3Config.bucket;

    const cmd = new GetObjectCommand({
      Bucket: bucket,
      Key: file.key,
    });

    const url = await getSignedUrl(this.s3, cmd, { expiresIn: validExpiresIn });

    return {
      fileId: file.id,
      key: file.key,
      url: url,
      contentType: file.contentType,
      size: file.size,
    };
  }

  // 获取文件信息
  async getFileById(fileId: number, userId: number) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('文件记录不存在');
    }

    // 验证文件所有权（如果文件有所有者）
    if (file.userId && file.userId !== userId) {
      throw new ForbiddenException('无权访问此文件');
    }

    return file;
  }

  private getFileExtension(contentType: string): string {
    const mimeTypes: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
    };

    return mimeTypes[contentType] || '';
  }

  /**
   * 直接上传Buffer到S3并创建文件记录
   * 用于AI生成的图片等场景
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    contentType: string,
    userId?: number,
  ): Promise<{ fileId: number; url: string; key: string }> {
    const bucket = this.appConfig.s3Config.bucket;
    const key = `generated/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${filename}`;

    // 直接上传到S3
    const putCmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3.send(putCmd);

    // 创建数据库记录
    const file = await this.prisma.file.create({
      data: {
        key,
        contentType,
        size: buffer.length,
        status: 'uploaded',
        userId,
      },
    });

    // 生成访问URL
    const getCmd = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3, getCmd, { expiresIn: 60 * 60 });

    return {
      fileId: file.id,
      url,
      key,
    };
  }
}
