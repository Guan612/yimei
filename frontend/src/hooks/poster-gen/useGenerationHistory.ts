"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useNavigate } from "@tanstack/react-router";
import { generationHistoryAtom } from "@/store/imageGen";
import { getHistoryImgApi, getByIdImgApi } from "@/api/imagegen";
import type { ImageGenerationHistory, ImageHistoryQuery } from "@/type/imagegen";
import type { PaginationInfo } from "@/type/common";
import { useAsyncOperation } from "@/hooks/common";

/**
 * 生成历史Hook返回类型
 */
export interface UseGenerationHistoryReturn {
  /** 历史记录列表 */
  history: ImageGenerationHistory[];
  /** 分页信息 */
  pagination: PaginationInfo | null;
  /** 加载历史记录 */
  loadHistory: (
    params?: ImageHistoryQuery
  ) => Promise<ImageGenerationHistory[] | null>;
  /** 查看详情 */
  viewDetail: (id: number) => Promise<ImageGenerationHistory | null>;
  /** 查看并跳转到详情页 */
  handleViewImage: (historyItem: ImageGenerationHistory) => void;
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
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const navigate = useNavigate();

  const { execute: loadHistory, loading } = useAsyncOperation(
    async (params?: ImageHistoryQuery) => {
      const res = await getHistoryImgApi(params);

      if (res.code === 0 && res.data) {
        setHistory(res.data.data);
        setPagination(res.data.pagination);
        return res.data.data;
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
   * 查看并跳转到详情页
   */
  const handleViewImage = (historyItem: ImageGenerationHistory) => {
    console.log("Navigating to:", `/poster-gen/${historyItem.id}`);
    navigate({
      to: "/poster-gen/$id" as any,
      params: { id: historyItem.id.toString() },
    });
  };

  // 组件挂载时加载历史记录
  useEffect(() => {
    if (history.length === 0) {
      loadHistory({ page: 1, pageSize: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    history,
    pagination,
    loadHistory,
    viewDetail,
    handleViewImage,
    loading,
  };
}
