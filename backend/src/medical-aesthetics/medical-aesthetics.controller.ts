import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MedicalAestheticsService } from './medical-aesthetics.service';
import {
  CreateMedicalAestheticDto,
  QueryMedicalAesthetiDto,
  UpdateMedicalAestheticDto,
} from './dto/medical-aesthetic.dto';
import { success } from 'src/common/result';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Role, Roles } from 'src/auth/decorators';
import { UserInfo } from 'src/auth/decorators/current-user.decorator';
import { TokenDto } from 'src/auth/dto/auth.dto';
import { PaginationQueryDto } from 'src/common/dto/common.dto';

@Controller('medical-aesthetics')
@ApiBearerAuth()
@ApiTags('前端提示词库')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalAestheticsController {
  constructor(
    private readonly medicalAestheticsService: MedicalAestheticsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: '创建系统示词' })
  async create(
    @Body() createMedicalAestheticDto: CreateMedicalAestheticDto,
    @UserInfo() user,
  ) {
    const res = await this.medicalAestheticsService.createPrompt(
      createMedicalAestheticDto,
      user.id,
    );
    return success('创建提示词标签成功', res);
  }

  @Get()
  @ApiOperation({ summary: '获取示词' })
  async findAll(@Query() category?: QueryMedicalAesthetiDto) {
    const res = await this.medicalAestheticsService.findAll(category);
    return success('返回所有提示词标签', res);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更改系统示词' })
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateMedicalAestheticDto: UpdateMedicalAestheticDto,
  ) {
    const res = await this.medicalAestheticsService.update(
      +id,
      updateMedicalAestheticDto,
    );
    return success('更新提示词成功', res);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除系统示词' })
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    const res = await this.medicalAestheticsService.remove(+id);
    return success('删除提示词成功', res);
  }

  // 用户个人提示词管理
  @Post('my')
  @ApiOperation({ summary: '创建个人提示词' })
  @Roles(Role.USER, Role.ADMIN)
  async createMyPrompt(
    @Body() createMedicalAestheticDto: CreateMedicalAestheticDto,
    @UserInfo() user: TokenDto,
  ) {
    const res = await this.medicalAestheticsService.createUserPrompt(
      createMedicalAestheticDto,
      user.id,
    );
    return success('创建个人提示词成功', res);
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的提示词列表（分页）' })
  @Roles(Role.USER, Role.ADMIN)
  async getMyPrompts(
    @UserInfo() user: TokenDto,
    @Query() query: PaginationQueryDto,
  ) {
    return await this.medicalAestheticsService.findUserPrompts(
      user.id,
      query.page,
      query.pageSize,
    );
  }

  @Patch('my/:id')
  @ApiOperation({ summary: '更新我的提示词' })
  @Roles(Role.USER, Role.ADMIN)
  async updateMyPrompt(
    @Param('id') id: string,
    @Body() updateMedicalAestheticDto: UpdateMedicalAestheticDto,
    @UserInfo() user: TokenDto,
  ) {
    const res = await this.medicalAestheticsService.updateUserPrompt(
      +id,
      user.id,
      updateMedicalAestheticDto,
    );
    return success('更新个人提示词成功', res);
  }

  @Delete('my/:id')
  @ApiOperation({ summary: '删除我的提示词' })
  @Roles(Role.USER, Role.ADMIN)
  async removeMyPrompt(@Param('id') id: string, @UserInfo() user: TokenDto) {
    const res = await this.medicalAestheticsService.removeUserPrompt(
      +id,
      user.id,
    );
    return success('删除个人提示词成功', res);
  }
}
