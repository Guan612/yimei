import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImageGenService } from './image-gen.service';
import {
  GenerateImageDto,
  InpaintImageDto,
  GenerateImageResponseDto,
  ImageGenerationHistoryQueryDto,
} from './dto/generate-image.dto';
import { Result, success } from '../common/result';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { UserInfo } from 'src/auth/decorators/current-user.decorator';
import { TokenDto } from 'src/auth/dto/auth.dto';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Role, Roles } from 'src/auth/decorators';

@ApiTags('图像生成')
@Controller('image-gen')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ImageGenController {
  constructor(private readonly imageGenService: ImageGenService) {}

  @Post('generate')
  @ApiOperation({ summary: '生成图片（文生图）- 异步任务' })
  async generateImage(
    @Body() dto: GenerateImageDto,
    @UserInfo() user: TokenDto,
  ) {
    const result = await this.imageGenService.generateImage(dto, user.id);
    return success('图片生成任务已提交', result);
  }

  @Post('inpaint')
  @ApiOperation({ summary: '图片局部修改（Inpainting）- 异步任务' })
  async inpaint(@Body() dto: InpaintImageDto, @UserInfo() user: TokenDto) {
    const result = await this.imageGenService.inpaint(dto, user.id);
    return success('图片修改任务已提交', result);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: '查询任务状态' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<Result<any>> {
    const status = await this.imageGenService.getJobStatus(jobId);
    return success('获取任务状态成功', status);
  }

  @Post('job/:jobId/cancel')
  @ApiOperation({ summary: '取消任务' })
  async cancelJob(@Param('jobId') jobId: string): Promise<Result<any>> {
    const result = await this.imageGenService.cancelJob(jobId);
    return success(result.message, result);
  }

  @Get('history')
  @ApiOperation({ summary: '获取用户的图片生成历史（分页）' })
  async getUserHistory(
    @UserInfo() user: TokenDto,
    @Query() query: ImageGenerationHistoryQueryDto,
  ): Promise<Result<any>> {
    const result = await this.imageGenService.getUserGenerations(
      user.id,
      query.page,
      query.pageSize,
    );
    return result;
  }

  @Get('admin/all-history')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '获取所有用户的图片生成历史（管理员）' })
  async getAllHistory(
    @Query() query: ImageGenerationHistoryQueryDto,
  ): Promise<Result<any>> {
    const result = await this.imageGenService.getAllGenerations(
      query.page,
      query.pageSize,
    );
    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个生成记录详情' })
  async getGenerationById(
    @Param('id', ParseIntPipe) id: number,
    @UserInfo() user: TokenDto,
  ): Promise<Result<any>> {
    const generation = await this.imageGenService.getGenerationById(
      id,
      user.id,
    );
    return success('获取记录成功', generation);
  }

  @Get('providers/list')
  @ApiOperation({ summary: '获取所有可用的AI Provider配置列表' })
  async getAvailableProviders(): Promise<Result<any>> {
    const providers = await this.imageGenService.getAvailableProviders();
    return success('获取Provider列表成功', providers);
  }

  @Post('providers/reload')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '重新加载Provider配置（管理员）' })
  async reloadProviders(): Promise<Result<any>> {
    const result = await this.imageGenService.reloadProviders();
    return success(`Provider配置已重新加载，当前${result.count}个可用`, result);
  }
}
