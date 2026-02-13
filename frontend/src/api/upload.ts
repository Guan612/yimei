import { api } from './index';
import type {
  UploadUrlResponse,
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  FileUrlResponse,
  BatchGetUrlsRequest,
  BatchGetUrlsResponse,
} from '@/type/upload';

/**
 * 文件上传 API
 */

/**
 * 获取预签名上传 URL
 */
export const getUploadUrlApi = (contentType: string) => {
  return api.post<UploadUrlResponse>('/api/upload', { contentType });
};

/**
 * 确认文件上传成功
 */
export const confirmUploadApi = (data: ConfirmUploadRequest) => {
  return api.put<ConfirmUploadResponse>('/api/upload/confirm', data);
};

/**
 * 根据文件 ID 获取访问 URL
 */
export const getFileUrlApi = (fileId: number, expiresIn = 3600) => {
  return api.get<FileUrlResponse>(
    `/api/upload/${fileId}/url?expiresIn=${expiresIn}`
  );
};

/**
 * 根据 key 获取访问 URL
 */
export const getFileUrlByKeyApi = (key: string, expiresIn = 3600) => {
  return api.get<FileUrlResponse>(
    `/api/upload/by-key?key=${key}&expiresIn=${expiresIn}`
  );
};

/**
 * 批量获取文件访问 URL
 * @param fileIds 文件ID数组（最多100个）
 * @param expiresIn URL有效期（秒），默认3小时
 */
export const getBatchFileUrlsApi = (data: BatchGetUrlsRequest) => {
  return api.post<BatchGetUrlsResponse>('/api/upload/batch-urls', data);
};

/**
 * 管理员批量获取文件访问 URL（无所有权限制）
 * @param fileIds 文件ID数组（最多100个）
 * @param expiresIn URL有效期（秒），默认3小时
 */
export const getBatchFileUrlsAsAdminApi = (data: BatchGetUrlsRequest) => {
  return api.post<BatchGetUrlsResponse>('/api/upload/admin/batch-urls', data);
};

/**
 * 管理员根据文件 ID 获取访问 URL（无所有权限制）
 */
export const getFileUrlAsAdminApi = (fileId: number, expiresIn = 3600) => {
  return api.get<FileUrlResponse>(
    `/api/upload/admin/${fileId}/url?expiresIn=${expiresIn}`
  );
};

/**
 * 上传文件到 S3（完整流程）
 * @param file 要上传的文件
 * @returns 上传成功后的文件 ID
 */
export const uploadFileApi = async (file: File): Promise<number> => {
  // 1. 获取预签名 URL
  const uploadUrlRes = await getUploadUrlApi(file.type);
  if (uploadUrlRes.code !== 0 || !uploadUrlRes.data) {
    throw new Error(uploadUrlRes.msg || '获取上传 URL 失败');
  }

  const { fileId, url } = uploadUrlRes.data;

  // 2. 直接上传文件到 S3
  const uploadResponse = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('上传文件失败');
  }

  // 3. 确认上传成功
  const confirmRes = await confirmUploadApi({
    fileId,
    size: file.size,
  });

  if (confirmRes.code !== 0) {
    throw new Error(confirmRes.msg || '确认上传失败');
  }

  return fileId;
};
