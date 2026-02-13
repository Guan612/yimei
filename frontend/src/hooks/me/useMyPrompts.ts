"use client";

import { useState, useEffect } from "react";
import {
  getMyPromptsApi,
  createMyPromptApi,
  updateMyPromptApi,
  deleteMyPromptApi,
} from "@/api/medicalAesthetics";
import type {
  medicalAestheticsRespons,
  creatMedicalAesthetics,
  updateMedicalAesthetics,
  PaginationInfo,
} from "@/type/medicalAesthetics";
import { toast } from "sonner";

/**
 * 个人提示词管理Hook配置
 */
export interface UseMyPromptsOptions {
  /** 自动加载数据 */
  autoLoad?: boolean;
  /** 初始页码 */
  initialPage?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 个人提示词管理Hook返回类型
 */
export interface UseMyPromptsReturn {
  /** 提示词列表 */
  prompts: medicalAestheticsRespons[];
  /** 分页信息 */
  pagination: PaginationInfo | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 是否正在提交 */
  submitting: boolean;
  /** 当前页码 */
  currentPage: number;
  /** 刷新列表 */
  reload: (page?: number) => Promise<void>;
  /** 切换页码 */
  changePage: (page: number) => Promise<void>;
  /** 创建提示词 */
  createPrompt: (data: creatMedicalAesthetics) => Promise<boolean>;
  /** 更新提示词 */
  updatePrompt: (
    id: number,
    data: updateMedicalAesthetics
  ) => Promise<boolean>;
  /** 删除提示词 */
  deletePrompt: (id: number) => Promise<boolean>;
}

/**
 * 个人提示词管理Hook
 *
 * @example
 * ```tsx
 * const { prompts, pagination, loading, createPrompt, updatePrompt, deletePrompt } =
 *   useMyPrompts();
 * ```
 */
export function useMyPrompts(
  options: UseMyPromptsOptions = {}
): UseMyPromptsReturn {
  const { autoLoad = true, initialPage = 1, pageSize = 6 } = options;
  const [prompts, setPrompts] = useState<medicalAestheticsRespons[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const reload = async (page?: number) => {
    try {
      setLoading(true);
      const pageToLoad = page ?? currentPage;
      const res = await getMyPromptsApi({ page: pageToLoad, pageSize });
      if (res.code === 0 && res.data) {
        setPrompts(res.data.data);
        setPagination(res.data.pagination);
        setCurrentPage(pageToLoad);
      } else {
        toast.error("加载失败", {
          description: res.msg,
        });
      }
    } catch (error: any) {
      toast.error("加载失败", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const changePage = async (page: number) => {
    await reload(page);
  };

  const createPrompt = async (
    data: creatMedicalAesthetics
  ): Promise<boolean> => {
    try {
      setSubmitting(true);
      const res = await createMyPromptApi(data);
      if (res.code === 0) {
        toast.success("提示词创建成功");
        await reload(1); // 创建后回到第一页
        return true;
      } else {
        toast.error("提示词创建失败", {
          description: res.msg,
        });
        return false;
      }
    } catch (error: any) {
      toast.error("提示词创建失败", {
        description: error.message,
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updatePrompt = async (
    id: number,
    data: updateMedicalAesthetics
  ): Promise<boolean> => {
    try {
      setSubmitting(true);
      const res = await updateMyPromptApi(id, data);
      if (res.code === 0) {
        toast.success("提示词更新成功");
        await reload(); // 保持在当前页
        return true;
      } else {
        toast.error("提示词更新失败", {
          description: res.msg,
        });
        return false;
      }
    } catch (error: any) {
      toast.error("提示词更新失败", {
        description: error.message,
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deletePrompt = async (id: number): Promise<boolean> => {
    try {
      const res = await deleteMyPromptApi(id);
      if (res.code === 0) {
        toast.success("提示词删除成功");
        // 如果当前页删除后没有数据且不是第一页，回到前一页
        const shouldGoToPreviousPage =
          prompts.length === 1 && currentPage > 1;
        await reload(shouldGoToPreviousPage ? currentPage - 1 : currentPage);
        return true;
      } else {
        toast.error("提示词删除失败", {
          description: res.msg,
        });
        return false;
      }
    } catch (error: any) {
      toast.error("提示词删除失败", {
        description: error.message,
      });
      return false;
    }
  };

  useEffect(() => {
    if (autoLoad) {
      reload();
    }
  }, [autoLoad]);

  return {
    prompts,
    pagination,
    loading,
    submitting,
    currentPage,
    reload,
    changePage,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
