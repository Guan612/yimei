/**
 * 图像生成相关类型定义
 */

// 请求类型
export interface GenerateImageRequest {
  prompt: string;
  promptInjectIds?: number[];
  promptInjectPosition?: "prepend" | "append";
  negativePrompt?: string;
  configId?: number;
  provider?: "stability" | "openai" | "aliyun" | "auto";
  width?: number;
  height?: number;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  style?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  samples?: number;
  model?: string;
  referenceImageUrl?: string;
  referenceImageBase64?: string;
  referenceImageMimeType?: string;
}

export interface InpaintImageRequest {
  imageId: number;
  maskId: number;
  prompt: string;
  promptInjectIds?: number[];
  promptInjectPosition?: "prepend" | "append";
  negativePrompt?: string;
  configId?: number;
  provider?: "stability" | "openai" | "Gemini" | "auto";
  strength?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
}

export interface ImageGenerationResponse {
  id: number;
  imageUrl: string;
  provider: string;
  configId: number;
  model?: string;
  createdAt: string;
}

// 任务提交响应
export interface JobSubmitResponse {
  jobId: string;
  message: string;
}

// 任务状态
export type JobStatus =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "paused";

// 后端嵌套响应结构
export interface NestedResultResponse<T> {
  success: boolean;
  data: T;
}

// 任务状态查询响应
export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number; // 0-100
  result?: ImageGenerationResponse | NestedResultResponse<ImageGenerationResponse>; // 完成时返回，支持嵌套结构
  error?: string; // 失败时返回
  createdAt: string;
  processedAt?: string;
  finishedAt?: string;
}

export interface ImageGenerationHistory {
  id: number;
  userId: number;
  prompt: string;
  negativePrompt?: string;
  provider: string;
  model?: string;
  status: string;
  type: string;
  file: {
    id: number;
    key: string;
    contentType: string;
  };
  createdAt: string;
}

export interface ProviderConfig {
  id: number;
  name: string;
  provider: string;
  modelId?: string;
  description?: string;
  priority: number;
}

export interface AiModelConfigFull {
  id: number;
  name: string;
  provider: string;
  type: string;
  modelId?: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderConfigRequest {
  name: string;
  provider: "stability" | "openai" | "aliyun";
  type: string;
  modelId?: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
  description?: string;
}
