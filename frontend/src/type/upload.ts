/**
 * 文件上传相关类型定义
 */

export interface UploadUrlResponse {
  fileId: number;
  key: string;
  url: string;
}

export interface ConfirmUploadRequest {
  fileId: number;
  size?: number;
}

export interface ConfirmUploadResponse {
  fileId: number;
  key: string;
  status: string;
}

export interface FileUrlResponse {
  fileId: number;
  key: string;
  url: string;
  contentType: string;
  size: number;
}

/**
 * 批量获取文件URL请求
 */
export interface BatchGetUrlsRequest {
  fileIds: number[];
  expiresIn?: number;
}

/**
 * 批量获取文件URL响应（数组形式）
 */
export type BatchGetUrlsResponse = FileUrlResponse[];
