/**
 * 通用类型定义
 */

// 后端统一返回格式（已在 api/index.tsx 中定义，这里重新导出供业务使用）
export interface Result<T = any> {
  code: number; // 0: 成功, 1: 失败
  msg: string;
  data?: T;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 分页查询参数
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

// Prisma 分页数据结构（与后端 PrismaService.paginate 返回格式一致）
export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationInfo;
}

// 分页响应（Result + PaginatedData 的组合）
export type PaginatedResponse<T> = Result<PaginatedData<T>>;
