import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ImageGenController } from './image-gen.controller';
import { ImageGenService } from './image-gen.service';
import { GenerateImageDto, InpaintImageDto } from './dto/generate-image.dto';
import { TokenDto } from '../auth/dto/auth.dto';

describe('ImageGenController', () => {
  let controller: ImageGenController;
  let imageGenService: ImageGenService;

  const mockUser: TokenDto = {
    id: 1,
    loginId: 'testuser',
    role: 'USER',
  };

  const mockImageGenService = {
    generateImage: vi.fn(),
    inpaint: vi.fn(),
    getJobStatus: vi.fn(),
    cancelJob: vi.fn(),
    getUserGenerations: vi.fn(),
    getGenerationById: vi.fn(),
    getAvailableProviders: vi.fn(),
    reloadProviders: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageGenController],
      providers: [
        {
          provide: ImageGenService,
          useValue: mockImageGenService,
        },
      ],
    }).compile();

    controller = module.get<ImageGenController>(ImageGenController);
    imageGenService = module.get<ImageGenService>(ImageGenService);

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateImage', () => {
    const generateDto: GenerateImageDto = {
      prompt: 'a beautiful landscape',
      width: 1024,
      height: 1024,
    };

    it('should submit image generation task', async () => {
      const mockResponse = {
        jobId: 'job-123',
        message: '图片生成任务已提交，请使用 jobId 查询任务状态',
      };

      mockImageGenService.generateImage.mockResolvedValue(mockResponse);

      const result = await controller.generateImage(generateDto, mockUser);

      expect(result).toEqual({
        code: 200,
        message: '图片生成任务已提交',
        data: mockResponse,
      });
      expect(imageGenService.generateImage).toHaveBeenCalledWith(
        generateDto,
        mockUser.id,
      );
    });
  });

  describe('inpaint', () => {
    const inpaintDto: InpaintImageDto = {
      imageId: 1,
      maskId: 2,
      prompt: 'change the color',
    };

    it('should submit inpaint task', async () => {
      const mockResponse = {
        jobId: 'job-456',
        message: '图片修改任务已提交，请使用 jobId 查询任务状态',
      };

      mockImageGenService.inpaint.mockResolvedValue(mockResponse);

      const result = await controller.inpaint(inpaintDto, mockUser);

      expect(result).toEqual({
        code: 200,
        message: '图片修改任务已提交',
        data: mockResponse,
      });
      expect(imageGenService.inpaint).toHaveBeenCalledWith(
        inpaintDto,
        mockUser.id,
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status', async () => {
      const mockStatus = {
        jobId: 'job-123',
        status: 'completed',
        progress: 100,
        result: {
          id: 1,
          imageUrl: 'https://example.com/image.png',
        },
      };

      mockImageGenService.getJobStatus.mockResolvedValue(mockStatus);

      const result = await controller.getJobStatus('job-123');

      expect(result).toEqual({
        code: 200,
        message: '获取任务状态成功',
        data: mockStatus,
      });
      expect(imageGenService.getJobStatus).toHaveBeenCalledWith('job-123');
    });
  });

  describe('cancelJob', () => {
    it('should cancel a job', async () => {
      const mockResponse = {
        message: '任务已取消',
        jobId: 'job-123',
      };

      mockImageGenService.cancelJob.mockResolvedValue(mockResponse);

      const result = await controller.cancelJob('job-123');

      expect(result).toEqual({
        code: 200,
        message: '任务已取消',
        data: mockResponse,
      });
      expect(imageGenService.cancelJob).toHaveBeenCalledWith('job-123');
    });
  });

  describe('getUserHistory', () => {
    it('should return user generation history with default pagination', async () => {
      const mockHistory = [
        {
          id: 1,
          userId: mockUser.id,
          imageUrl: 'https://example.com/image1.png',
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: mockUser.id,
          imageUrl: 'https://example.com/image2.png',
          createdAt: new Date(),
        },
      ];

      mockImageGenService.getUserGenerations.mockResolvedValue(mockHistory);

      const result = await controller.getUserHistory(mockUser, 20, 0);

      expect(result).toEqual({
        code: 200,
        message: '获取历史记录成功',
        data: mockHistory,
      });
      expect(imageGenService.getUserGenerations).toHaveBeenCalledWith(
        mockUser.id,
        20,
        0,
      );
    });

    it('should return user generation history with custom pagination', async () => {
      const mockHistory = [
        {
          id: 3,
          userId: mockUser.id,
          imageUrl: 'https://example.com/image3.png',
          createdAt: new Date(),
        },
      ];

      mockImageGenService.getUserGenerations.mockResolvedValue(mockHistory);

      const result = await controller.getUserHistory(mockUser, 10, 20);

      expect(result).toEqual({
        code: 200,
        message: '获取历史记录成功',
        data: mockHistory,
      });
      expect(imageGenService.getUserGenerations).toHaveBeenCalledWith(
        mockUser.id,
        10,
        20,
      );
    });
  });

  describe('getGenerationById', () => {
    it('should return generation by id', async () => {
      const mockGeneration = {
        id: 1,
        userId: mockUser.id,
        imageUrl: 'https://example.com/image.png',
        prompt: 'a beautiful landscape',
        createdAt: new Date(),
      };

      mockImageGenService.getGenerationById.mockResolvedValue(mockGeneration);

      const result = await controller.getGenerationById(1, mockUser);

      expect(result).toEqual({
        code: 200,
        message: '获取记录成功',
        data: mockGeneration,
      });
      expect(imageGenService.getGenerationById).toHaveBeenCalledWith(
        1,
        mockUser.id,
      );
    });
  });

  describe('getAvailableProviders', () => {
    it('should return available providers list', async () => {
      const mockProviders = [
        {
          id: 1,
          name: 'Provider 1',
          type: 'image-gen',
          enabled: true,
        },
        {
          id: 2,
          name: 'Provider 2',
          type: 'image-gen',
          enabled: true,
        },
      ];

      mockImageGenService.getAvailableProviders.mockResolvedValue(
        mockProviders,
      );

      const result = await controller.getAvailableProviders();

      expect(result).toEqual({
        code: 200,
        message: '获取Provider列表成功',
        data: mockProviders,
      });
      expect(imageGenService.getAvailableProviders).toHaveBeenCalled();
    });
  });

  describe('reloadProviders', () => {
    it('should reload provider configurations', async () => {
      const mockResult = {
        count: 3,
        providers: ['provider1', 'provider2', 'provider3'],
      };

      mockImageGenService.reloadProviders.mockResolvedValue(mockResult);

      const result = await controller.reloadProviders();

      expect(result).toEqual({
        code: 200,
        message: 'Provider配置已重新加载，当前3个可用',
        data: mockResult,
      });
      expect(imageGenService.reloadProviders).toHaveBeenCalled();
    });
  });
});
