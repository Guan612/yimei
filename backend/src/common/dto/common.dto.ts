import { createZodDto } from "nestjs-zod";
import z from "zod";

// 分页查询参数
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('页码'),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).describe('每页数量'),
});

export class PaginationQueryDto extends createZodDto(
  PaginationQuerySchema,
) {}

// Prisma 分页数据结构（与 PrismaService.paginate 返回格式一致）
export interface PrismaPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 分页参数接口
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}