/**
 * 模型配置相关类型定义
 */

import type { PaginatedData, PaginationQuery } from './common';

// Provider类型
export type ProviderType = 'stability' | 'openai' | 'aliyun' | 'gemini';

// 服务类型
export type ServiceType = 'image-gen' | 'text-gen' | 'embedding';

// 模型配置完整信息
export interface ModelConfig {
  id: number;
  name: string;
  provider: ProviderType;
  type: ServiceType;
  modelId?: string;
  baseUrl: string;
  apiKey: string;
  config?: Record<string, any>;
  enabled: boolean;
  priority: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建模型配置DTO
export interface CreateModelConfigDto {
  name: string;
  provider: ProviderType;
  type?: ServiceType;
  modelId?: string;
  baseUrl: string;
  apiKey: string;
  config?: Record<string, any>;
  enabled?: boolean;
  priority?: number;
  description?: string;
}

// 更新模型配置DTO（所有字段可选）
export interface UpdateModelConfigDto {
  name?: string;
  provider?: ProviderType;
  type?: ServiceType;
  modelId?: string;
  baseUrl?: string;
  apiKey?: string;
  config?: Record<string, any>;
  enabled?: boolean;
  priority?: number;
  description?: string;
}

// 查询模型配置DTO（继承分页参数）
export interface QueryModelConfigDto extends PaginationQuery {
  provider?: string;
  type?: string;
  enabled?: boolean;
}

// 验证配置DTO
export interface ValidateConfigDto {
  testPrompt?: string;
}

// 成本统计DTO
export interface CostStatsDto {
  startDate?: string;
  endDate?: string;
}

// 限流配置DTO
export interface RateLimitConfigDto {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
}

// 参数预设DTO
export interface PresetParamsDto {
  presetName: string;
  params: Record<string, any>;
}

// 模型配置列表响应（使用统一的分页数据结构）
export type ModelConfigListResponse = PaginatedData<ModelConfig>;

// 成本统计响应
export interface CostStatsResponse {
  configId: number;
  configName: string;
  provider: string;
  totalCost: number;
  totalRequests: number;
  avgCost: number;
  recentGenerations: {
    id: number;
    prompt: string;
    cost: number;
    createdAt: string;
  }[];
}

// 限流配置响应
export interface RateLimitResponse {
  configId: number;
  rateLimit: RateLimitConfigDto | null;
}

// 参数预设响应
export interface PresetsResponse {
  configId: number;
  presets: Record<string, Record<string, any>>;
}
