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
import { ModelconfigService } from './modelconfig.service';
import {
  CreateModelconfigDto,
  UpdateModelconfigDto,
  QueryModelconfigDto,
  ValidateConfigDto,
  CostStatsDto,
  RateLimitConfigDto,
  PresetParamsDto,
} from './dto/modelconfig.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { success } from '../common/result';

@Controller('modelconfig')
@ApiTags('AI模型配置管理')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModelconfigController {
  constructor(private readonly modelconfigService: ModelconfigService) {}

  @Post()
  @ApiOperation({ summary: '创建Provider配置' })
  async create(@Body() createModelconfigDto: CreateModelconfigDto) {
    const data = await this.modelconfigService.create(createModelconfigDto);
    return success('配置创建成功', data);
  }

  @Get()
  @ApiOperation({ summary: '获取所有Provider配置（支持筛选和分页）' })
  async findAll(@Query() query: QueryModelconfigDto) {
    return await this.modelconfigService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取Provider配置' })
  async findOne(@Param('id') id: string) {
    const data = await this.modelconfigService.findOne(+id);
    return success('查询成功', data);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新Provider配置' })
  async update(
    @Param('id') id: string,
    @Body() updateModelconfigDto: UpdateModelconfigDto,
  ) {
    const data = await this.modelconfigService.update(
      +id,
      updateModelconfigDto,
    );
    return success('配置更新成功', data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除Provider配置' })
  async remove(@Param('id') id: string) {
    await this.modelconfigService.remove(+id);
    return success('配置删除成功');
  }

  @Post(':id/validate')
  @ApiOperation({ summary: '验证配置是否有效（测试API Key）' })
  async validateConfig(
    @Param('id') id: string,
    @Body() validateDto?: ValidateConfigDto,
  ) {
    const data = await this.modelconfigService.validateConfig(+id, validateDto);
    return success(data.valid ? 'API Key 验证成功' : 'API Key 验证失败', data);
  }

  @Get(':id/cost-stats')
  @ApiOperation({ summary: '获取成本统计（按配置维度）' })
  async getCostStats(
    @Param('id') id: string,
    @Query() statsDto?: CostStatsDto,
  ) {
    const data = await this.modelconfigService.getCostStats(+id, statsDto);
    return success('成本统计查询成功', data);
  }

  @Post(':id/rate-limit')
  @ApiOperation({ summary: '设置请求限流（按配置维度）' })
  async setRateLimit(
    @Param('id') id: string,
    @Body() rateLimitDto: RateLimitConfigDto,
  ) {
    const data = await this.modelconfigService.setRateLimit(+id, rateLimitDto);
    return success('限流配置设置成功', data);
  }

  @Get(':id/rate-limit')
  @ApiOperation({ summary: '获取限流配置' })
  async getRateLimit(@Param('id') id: string) {
    const data = await this.modelconfigService.getRateLimit(+id);
    return success('查询成功', data);
  }

  @Post(':id/presets')
  @ApiOperation({ summary: '设置参数预设' })
  async setPreset(@Param('id') id: string, @Body() presetDto: PresetParamsDto) {
    const data = await this.modelconfigService.setPreset(+id, presetDto);
    return success('参数预设设置成功', data);
  }

  @Get(':id/presets')
  @ApiOperation({ summary: '获取所有参数预设' })
  async getPresets(@Param('id') id: string) {
    const data = await this.modelconfigService.getPresets(+id);
    return success('查询成功', data);
  }

  @Delete(':id/presets/:presetName')
  @ApiOperation({ summary: '删除参数预设' })
  async deletePreset(
    @Param('id') id: string,
    @Param('presetName') presetName: string,
  ) {
    await this.modelconfigService.deletePreset(+id, presetName);
    return success('参数预设删除成功');
  }
}
