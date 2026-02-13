import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../../generated/prisma/client';

export type PrismaTx = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    const adapter = new PrismaPg({ connectionString });

    super({
      adapter,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async tx<T>(
    fn: (tx: PrismaTx) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ) {
    return this.$transaction((tx) => fn(tx), options);
  }

  /**
   * 通用分页查询方法
   * @param model - Prisma 模型（如 this.prisma.user）
   * @param options - 查询选项
   * @returns 分页结果（数据 + 分页信息）
   */
  async paginate<T>(
    model: any,
    options: {
      where?: any;
      page?: number;
      pageSize?: number;
      orderBy?: any;
      include?: any;
      select?: any;
    } = {},
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      where = {},
      page = 1,
      pageSize = 10,
      orderBy,
      include,
      select,
    } = options;

    // 计算 skip 和 take
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 构建查询参数
    const findManyArgs: any = {
      where,
      skip,
      take,
    };

    if (orderBy) findManyArgs.orderBy = orderBy;
    if (include) findManyArgs.include = include;
    if (select) findManyArgs.select = select;

    // 并行查询总数和分页数据
    const [total, data] = await Promise.all([
      model.count({ where }),
      model.findMany(findManyArgs),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
