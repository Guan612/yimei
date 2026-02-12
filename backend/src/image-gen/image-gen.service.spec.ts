import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';
import { ImageGenService } from './image-gen.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { AiProviderService } from '../ai-provider/ai-provider.service';
import { QUEUE_NAMES } from '../queue/constants';
import { GenerateImageDto, InpaintImageDto } from './dto/generate-image.dto';

describe('ImageGenService', () => {
  let service: ImageGenService;
  let prismaService: PrismaService;
  let uploadService: UploadService;
  let aiProviderService: AiProviderService;
  let imageQueue: Queue;

  const mockUser = { id: 1 };
  const mockFile = {
    id: 1,
    key: 'test-key',
    contentType: 'image/png',
    status: 'uploaded',
    userId: 1,
  };

  const mockProvider = {
    generateImage: vi.fn(),
    inpaint: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageGenService,
        {
          provide: PrismaService,
          useValue: {
            imageGeneration: {
              create: vi.fn(),
              findMany: vi.fn(),
              findFirst: vi.fn(),
            },
            file: {
              create: vi.fn(),
              findUnique: vi.fn(),
            },
            medicalAesthetics: {
              findMany: vi.fn(),
            },
          },
        },
        {
          provide: UploadService,
          useValue: {
            uploadBuffer: vi.fn(),
            getFileUrl: vi.fn(),
          },
        },
        {
          provide: AiProviderService,
          useValue: {
            getImageGenProvider: vi.fn().mockReturnValue(mockProvider),
            selectImageGenProvider: vi.fn().mockResolvedValue(mockProvider),
            getAvailableProviders: vi.fn(),
            reloadProviders: vi.fn(),
          },
        },
        {
          provide: getQueueToken(QUEUE_NAMES.IMAGE_GENERATION),
          useValue: {
            add: vi.fn(),
            getJob: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ImageGenService>(ImageGenService);
    prismaService = module.get<PrismaService>(PrismaService);
    uploadService = module.get<UploadService>(UploadService);
    aiProviderService = module.get<AiProviderService>(AiProviderService);
    imageQueue = module.get<Queue>(getQueueToken(QUEUE_NAMES.IMAGE_GENERATION));

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateImage', () => {
    const generateDto: GenerateImageDto = {
      prompt: 'a beautiful landscape',
      width: 1024,
      height: 1024,
    };

    it('should submit image generation job to queue', async () => {
      const mockJob = {
        id: 'job-123',
        timestamp: Date.now(),
      };

      vi.spyOn(imageQueue, 'add').mockResolvedValue(mockJob as any);

      const result = await service.generateImage(generateDto, mockUser.id);

      expect(result).toEqual({
        jobId: 'job-123',
        message: '图片生成任务已提交，请使用 jobId 查询任务状态',
      });
      expect(imageQueue.add).toHaveBeenCalledWith(
        'generate-image',
        {
          type: 'generate',
          userId: mockUser.id,
          dto: generateDto,
        },
        {
          removeOnComplete: { age: 300, count: 100 },
          removeOnFail: false,
        },
      );
    });
  });

  describe('generateImageInternal', () => {
    const generateDto: GenerateImageDto = {
      prompt: 'a beautiful landscape',
      width: 1024,
      height: 1024,
    };

    it('should generate image successfully with base64 response', async () => {
      const mockResult = {
        success: true,
        imageBase64: 'base64-encoded-image',
        provider: 'test-provider',
        model: 'test-model',
        cost: 0.1,
        metadata: {},
      };

      mockProvider.generateImage.mockResolvedValue(mockResult);

      vi.spyOn(uploadService, 'uploadBuffer').mockResolvedValue({
        url: 'https://example.com/image.png',
        fileId: 1,
      } as any);

      vi.spyOn(prismaService.imageGeneration, 'create').mockResolvedValue({
        id: 1,
        userId: mockUser.id,
        fileId: 1,
        createdAt: new Date(),
      } as any);

      const result = await service.generateImageInternal(
        generateDto,
        mockUser.id,
      );

      expect(result).toMatchObject({
        id: 1,
        imageUrl: 'https://example.com/image.png',
        provider: 'test-provider',
        model: 'test-model',
      });
      expect(mockProvider.generateImage).toHaveBeenCalled();
      expect(uploadService.uploadBuffer).toHaveBeenCalled();
    });

    it('should throw BadRequestException when generation fails', async () => {
      const mockResult = {
        success: false,
        error: 'Generation failed',
      };

      mockProvider.generateImage.mockResolvedValue(mockResult);

      await expect(
        service.generateImageInternal(generateDto, mockUser.id),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle prompt injection', async () => {
      const dtoWithInjection: GenerateImageDto = {
        ...generateDto,
        promptInjectIds: [1, 2],
        promptInjectPosition: 'prepend',
      };

      vi.spyOn(prismaService.medicalAesthetics, 'findMany').mockResolvedValue([
        { id: 1, prompt: 'injected prompt 1' },
        { id: 2, prompt: 'injected prompt 2' },
      ] as any);

      const mockResult = {
        success: true,
        imageUrl: 'https://example.com/image.png',
        provider: 'test-provider',
        model: 'test-model',
        cost: 0.1,
        metadata: {},
      };

      mockProvider.generateImage.mockResolvedValue(mockResult);

      vi.spyOn(prismaService.file, 'create').mockResolvedValue(mockFile as any);
      vi.spyOn(prismaService.imageGeneration, 'create').mockResolvedValue({
        id: 1,
        userId: mockUser.id,
        fileId: 1,
        file: mockFile,
        createdAt: new Date(),
      } as any);

      await service.generateImageInternal(dtoWithInjection, mockUser.id);

      expect(prismaService.medicalAesthetics.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        select: { id: true, prompt: true },
      });
    });
  });

  describe('inpaint', () => {
    const inpaintDto: InpaintImageDto = {
      imageId: 1,
      maskId: 2,
      prompt: 'change the color',
    };

    it('should submit inpaint job to queue', async () => {
      const mockJob = {
        id: 'job-456',
        timestamp: Date.now(),
      };

      vi.spyOn(imageQueue, 'add').mockResolvedValue(mockJob as any);

      const result = await service.inpaint(inpaintDto, mockUser.id);

      expect(result).toEqual({
        jobId: 'job-456',
        message: '图片局部重绘任务已提交，请使用 jobId 查询任务状态',
      });
      expect(imageQueue.add).toHaveBeenCalledWith(
        'inpaint-image',
        {
          type: 'inpaint',
          userId: mockUser.id,
          dto: inpaintDto,
        },
        {
          removeOnComplete: { age: 300, count: 100 },
          removeOnFail: false,
        },
      );
    });
  });

  describe('getUserGenerations', () => {
    it('should return user generations with pagination', async () => {
      const mockGenerations = [
        {
          id: 1,
          userId: mockUser.id,
          file: mockFile,
          createdAt: new Date(),
        },
      ];

      vi.spyOn(prismaService.imageGeneration, 'findMany').mockResolvedValue(
        mockGenerations as any,
      );

      const result = await service.getUserGenerations(mockUser.id, 20, 0);

      expect(result).toEqual(mockGenerations);
      expect(prismaService.imageGeneration.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { file: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
    });
  });

  describe('getGenerationById', () => {
    it('should return generation by id', async () => {
      const mockGeneration = {
        id: 1,
        userId: mockUser.id,
        file: mockFile,
      };

      vi.spyOn(prismaService.imageGeneration, 'findFirst').mockResolvedValue(
        mockGeneration as any,
      );

      const result = await service.getGenerationById(1, mockUser.id);

      expect(result).toEqual(mockGeneration);
      expect(prismaService.imageGeneration.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: mockUser.id },
        include: { file: true },
      });
    });

    it('should throw NotFoundException when generation not found', async () => {
      vi.spyOn(prismaService.imageGeneration, 'findFirst').mockResolvedValue(
        null,
      );

      await expect(service.getGenerationById(999, mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const mockJob = {
        id: 'job-123',
        timestamp: Date.now(),
        processedOn: Date.now(),
        finishedOn: Date.now(),
        progress: 100,
        returnvalue: { result: 'success' },
        failedReason: null,
        getState: vi.fn().mockResolvedValue('completed'),
      };

      vi.spyOn(imageQueue, 'getJob').mockResolvedValue(mockJob as any);

      const result = await service.getJobStatus('job-123');

      expect(result).toMatchObject({
        jobId: 'job-123',
        status: 'completed',
        progress: 100,
        result: { result: 'success' },
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      vi.spyOn(imageQueue, 'getJob').mockResolvedValue(null);

      await expect(service.getJobStatus('invalid-job')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelJob', () => {
    it('should cancel a pending job', async () => {
      const mockJob = {
        id: 'job-123',
        getState: vi.fn().mockResolvedValue('waiting'),
        remove: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(imageQueue, 'getJob').mockResolvedValue(mockJob as any);

      const result = await service.cancelJob('job-123');

      expect(result).toEqual({
        message: '任务已取消',
        jobId: 'job-123',
      });
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to cancel completed job', async () => {
      const mockJob = {
        id: 'job-123',
        getState: vi.fn().mockResolvedValue('completed'),
      };

      vi.spyOn(imageQueue, 'getJob').mockResolvedValue(mockJob as any);

      await expect(service.cancelJob('job-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAvailableProviders', () => {
    it('should return available providers', async () => {
      const mockProviders = [
        { id: 1, name: 'Provider 1' },
        { id: 2, name: 'Provider 2' },
      ];

      vi.spyOn(aiProviderService, 'getAvailableProviders').mockResolvedValue(
        mockProviders as any,
      );

      const result = await service.getAvailableProviders();

      expect(result).toEqual(mockProviders);
      expect(aiProviderService.getAvailableProviders).toHaveBeenCalledWith(
        'image-gen',
      );
    });
  });

  describe('reloadProviders', () => {
    it('should reload providers', async () => {
      const mockResult = { count: 3 };

      vi.spyOn(aiProviderService, 'reloadProviders').mockResolvedValue(
        mockResult as any,
      );

      const result = await service.reloadProviders();

      expect(result).toEqual(mockResult);
      expect(aiProviderService.reloadProviders).toHaveBeenCalled();
    });
  });
});
