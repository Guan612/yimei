import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import {
  CreateUploadDto,
  ConfirmUploadDto,
  BatchGetUrlsDto,
} from './dto/upload.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { success } from '../common/result';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UserInfo } from '../auth/decorators/current-user.decorator';
import { Role, Roles } from '../auth/decorators';
import { TokenDto } from '../auth/dto/auth.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('upload')
@ApiTags('上传对象存储')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: '获取预签名上传URL' })
  async create(
    @Body() createUploadDto: CreateUploadDto,
    @UserInfo() user: TokenDto,
  ) {
    const data = await this.uploadService.create(
      createUploadDto.contentType,
      user.id,
    );
    return success('成功返回上传地址', data);
  }

  @Put('confirm')
  @ApiOperation({ summary: '确认文件上传成功' })
  async confirmUpload(
    @Body() confirmUploadDto: ConfirmUploadDto,
    @UserInfo() user: TokenDto,
  ) {
    const data = await this.uploadService.confirmUpload(
      confirmUploadDto.fileId,
      user.id,
      confirmUploadDto.size,
    );
    return success('确认上传成功', data);
  }

  @Post('batch-urls')
  @ApiOperation({ summary: '批量获取文件访问URL' })
  async getBatchFileUrls(
    @Body() batchGetUrlsDto: BatchGetUrlsDto,
    @UserInfo() user?: TokenDto,
  ) {
    const data = await this.uploadService.getBatchFileUrls(
      batchGetUrlsDto.fileIds,
      user?.id || 0,
      batchGetUrlsDto.expiresIn,
    );
    return success('成功获取文件访问URL', data);
  }

  @Post('admin/batch-urls')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '管理员批量获取文件访问URL（无所有权限制）' })
  async getBatchFileUrlsAsAdmin(@Body() batchGetUrlsDto: BatchGetUrlsDto) {
    const data = await this.uploadService.getBatchFileUrlsAsAdmin(
      batchGetUrlsDto.fileIds,
      batchGetUrlsDto.expiresIn,
    );
    return success('成功获取文件访问URL', data);
  }

  @Get('admin/:fileId/url')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '管理员根据文件ID获取访问URL（无所有权限制）' })
  async getFileUrlAsAdmin(
    @Param('fileId') fileId: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const expires = expiresIn ? parseInt(expiresIn) : 60 * 60;
    const data = await this.uploadService.getFileUrlAsAdmin(
      parseInt(fileId),
      expires,
    );
    return success('成功获取文件访问URL', data);
  }

  @Get(':fileId/url')
  @ApiOperation({ summary: '根据文件ID获取访问URL' })
  async getFileUrl(
    @Param('fileId') fileId: string,
    @Query('expiresIn') expiresIn?: string,
    @UserInfo() user?: TokenDto,
  ) {
    const expires = expiresIn ? parseInt(expiresIn) : 60 * 60;
    const data = await this.uploadService.getFileUrl(
      parseInt(fileId),
      user?.id || 0,
      expires,
    );
    return success('成功获取文件访问URL', data);
  }

  @Get('by-key')
  @ApiOperation({ summary: '根据key获取访问URL' })
  async getFileUrlByKey(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn?: string,
    @UserInfo() user?: TokenDto,
  ) {
    const expires = expiresIn ? parseInt(expiresIn) : 60 * 60;
    const data = await this.uploadService.getFileUrlByKey(
      key,
      user?.id || 0,
      expires,
    );
    return success('成功获取文件访问URL', data);
  }

  @Get(':fileId')
  @ApiOperation({ summary: '获取文件信息' })
  async getFileById(
    @Param('fileId') fileId: string,
    @UserInfo() user: TokenDto,
  ) {
    const data = await this.uploadService.getFileById(
      parseInt(fileId),
      user.id,
    );
    return success('成功获取文件信息', data);
  }
}
