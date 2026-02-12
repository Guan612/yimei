"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { generationHistoryAtom, currentGeneratedImageAtom } from "@/store/imageGen";
import { getHistoryImgApi, getByIdImgApi } from "@/api/imagegen";
import type { ImageGenerationHistory } from "@/type/imagegen";
import { toast } from "sonner";
import { useAsyncOperation } from "@/hooks/common";

/**
 * 生成历史Hook返回类型
 */
export interface UseGenerationHistoryReturn {
  /** 历史记录列表 */
  history: ImageGenerationHistory[];
  /** 加载历史记录 */
  loadHistory: (
    limit?: number,
    offset?: number
  ) => Promise<ImageGenerationHistory[] | null>;
  /** 查看详情 */
  viewDetail: (id: number) => Promise<ImageGenerationHistory | null>;
  /** 查看并设置图片 */
  handleViewImage: (historyItem: ImageGenerationHistory) => Promise<void>;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 生成历史Hook
 *
 * 管理图片生成历史记录的加载和查看,集成Jotai全局状态
 *
 * @example
 * ```tsx
 * const { history, loadHistory, handleViewImage, loading } = useGenerationHistory();
 *
 * // 加载历史
 * useEffect(() => {
 *   loadHistory();
 * }, []);
 *
 * // 查看图片
 * const onViewClick = (item: ImageGenerationHistory) => {
 *   await handleViewImage(item);
 * };
 * ```
 */
export function useGenerationHistory(): UseGenerationHistoryReturn {
  const [history, setHistory] = useAtom(generationHistoryAtom);
  const setCurrentImage = useSetAtom(currentGeneratedImageAtom);

  const { execute: loadHistory, loading } = useAsyncOperation(
    async (limit: number = 20, offset: number = 0) => {
      const res = await getHistoryImgApi(limit, offset);

      if (res.code === 0 && res.data) {
        setHistory(res.data);
        return res.data;
      } else {
        throw new Error(res.msg || "加载历史记录失败");
      }
    },
    {
      showToast: false, // 不显示成功提示
      errorMessage: "加载历史记录失败",
    }
  );

  const { execute: viewDetail } = useAsyncOperation(
    async (id: number) => {
      const res = await getByIdImgApi(id);

      if (res.code === 0 && res.data) {
        return res.data;
      } else {
        throw new Error(res.msg || "加载详情失败");
      }
    },
    {
      showToast: false,
      errorMessage: "加载详情失败",
    }
  );

  /**
   * 查看并设置图片到当前显示区域
   */
  const handleViewImage = async (historyItem: ImageGenerationHistory) => {
    try {
      const detail = await viewDetail(historyItem.id);

      if (!detail) {
        toast.error("加载图片失败");
        return;
      }

      // 从detail构造currentImage格式
      setCurrentImage({
        id: detail.id,
        imageUrl: detail.file.key,
        provider: detail.provider,
        configId: 0, // 历史记录可能没有configId
        model: detail.model,
        createdAt: detail.createdAt,
      });

      // 滚动到顶部查看图片
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error("加载图片失败", {
        description: error.message,
      });
    }
  };

  // 组件挂载时加载历史记录
  useEffect(() => {
    if (history.length === 0) {
      loadHistory();
    }
  }, []);

  return {
    history,
    loadHistory,
    viewDetail,
    handleViewImage,
    loading,
  };
}
