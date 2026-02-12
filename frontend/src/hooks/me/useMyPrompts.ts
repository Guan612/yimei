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
} from "@/type/medicalAesthetics";
import { toast } from "sonner";

/**
 * 个人提示词管理Hook配置
 */
export interface UseMyPromptsOptions {
  /** 自动加载数据 */
  autoLoad?: boolean;
}

/**
 * 个人提示词管理Hook返回类型
 */
export interface UseMyPromptsReturn {
  /** 提示词列表 */
  prompts: medicalAestheticsRespons[];
  /** 是否正在加载 */
  loading: boolean;
  /** 是否正在提交 */
  submitting: boolean;
  /** 刷新列表 */
  reload: () => Promise<void>;
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
 * const { prompts, loading, createPrompt, updatePrompt, deletePrompt } =
 *   useMyPrompts();
 * ```
 */
export function useMyPrompts(
  options: UseMyPromptsOptions = {}
): UseMyPromptsReturn {
  const { autoLoad = true } = options;
  const [prompts, setPrompts] = useState<medicalAestheticsRespons[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = async () => {
    try {
      setLoading(true);
      const res = await getMyPromptsApi();
      if (res.code === 0 && res.data) {
        setPrompts(res.data);
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

  const createPrompt = async (
    data: creatMedicalAesthetics
  ): Promise<boolean> => {
    try {
      setSubmitting(true);
      const res = await createMyPromptApi(data);
      if (res.code === 0) {
        toast.success("提示词创建成功");
        await reload();
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
        await reload();
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
        await reload();
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
    loading,
    submitting,
    reload,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
