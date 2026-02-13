"use client";

import { useState, useEffect, Dispatch, SetStateAction } from "react";
import {
  modelListApi,
} from "@/api/modelconfig";
import type {
  ModelConfig,
  QueryModelConfigDto,
} from "@/type/modelconfig";
import { toast } from "sonner";

/**
 * 模型配置列表Hook返回类型
 */
export interface UseModelConfigListReturn {
  /** 配置列表 */
  configs: ModelConfig[];
  /** 加载状态 */
  loading: boolean;
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 查询条件 */
  query: QueryModelConfigDto;
  /** 设置页码 */
  setPage: (page: number) => void;
  /** 设置查询条件 */
  setQuery: Dispatch<SetStateAction<QueryModelConfigDto>>;
  /** 更新筛选条件并重置页码 */
  handleFilterChange: (key: keyof QueryModelConfigDto, value: any) => void;
  /** 重新加载数据 */
  reload: () => Promise<void>;
}

/**
 * 模型配置列表Hook
 *
 * 管理模型配置列表的数据加载、分页和筛选
 *
 * @example
 * ```tsx
 * const {
 *   configs,
 *   loading,
 *   page,
 *   setPage,
 *   handleFilterChange,
 *   reload,
 * } = useModelConfigList();
 * ```
 */
export function useModelConfigList(): UseModelConfigListReturn {
  const [configs, setConfigs] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [query, setQuery] = useState<QueryModelConfigDto>({});

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const res = await modelListApi({ ...query, page, pageSize });
      if (res.code === 0 && res.data) {
        setConfigs(res.data.data || []);
        setTotal(res.data.pagination.total || 0);
        setTotalPages(res.data.pagination.totalPages || 0);
      }
    } catch (error: any) {
      toast.error("加载模型配置失败", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof QueryModelConfigDto, value: any) => {
    setQuery((prev) => ({
      ...prev,
      [key]: value,
    }));
    setPage(1); // 筛选时重置到第一页
  };

  // 监听page和query变化,自动重新加载
  useEffect(() => {
    loadConfigs();
  }, [page, query]);

  return {
    configs,
    loading,
    total,
    page,
    pageSize,
    totalPages,
    query,
    setPage,
    setQuery,
    handleFilterChange,
    reload: loadConfigs,
  };
}
