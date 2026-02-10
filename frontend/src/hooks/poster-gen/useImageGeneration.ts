"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  isGeneratingAtom,
  currentGeneratedImageAtom,
  generationErrorAtom,
} from "@/store/imageGen";
import { generateImgApi } from "@/api/imagegen";
import { useJobPolling } from "@/hooks/common/useJobPolling";
import type {
  GenerateImageRequest,
  ImageGenerationResponse,
} from "@/type/imagegen";
import { toast } from "sonner";

/**
 * 图片生成Hook配置
 */
export interface UseImageGenerationOptions {
  /** 成功后的回调 */
  onSuccess?: (result: ImageGenerationResponse) => void;
  /** 失败后的回调 */
  onError?: (error: Error) => void;
}

/**
 * 图片生成Hook返回类型
 */
export interface UseImageGenerationReturn {
  /** 生成图片 */
  generate: (request: GenerateImageRequest) => Promise<void>;
  /** 是否正在生成 */
  isGenerating: boolean;
  /** 生成进度 (0-100) */
  progress: number;
  /** 当前生成的图片 */
  currentImage: ImageGenerationResponse | null;
  /** 错误信息 */
  error: string | null;
  /** 重置状态 */
  reset: () => void;
  /** 取消任务 */
  cancel: () => Promise<void>;
}

/**
 * 图片生成Hook
 *
 * 封装图片生成的核心逻辑，支持异步任务和进度跟踪
 *
 * @example
 * ```tsx
 * const { generate, isGenerating, progress, currentImage, error } = useImageGeneration({
 *   onSuccess: (result) => {
 *     console.log('生成成功', result);
 *   },
 * });
 *
 * // 生成图片
 * await generate({
 *   prompt: "一张海报",
 *   configId: selectedProviderId,
 *   aspectRatio: "1:1",
 * });
 * ```
 */
export function useImageGeneration(
  options: UseImageGenerationOptions = {}
): UseImageGenerationReturn {
  const { onSuccess, onError } = options;

  // 使用Jotai atoms管理全局状态
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [currentImage, setCurrentImage] = useAtom(currentGeneratedImageAtom);
  const [error, setError] = useAtom(generationErrorAtom);

  // 本地状态：jobId 和 progress
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // 使用轮询 hook
  const { isPolling, cancelJob } = useJobPolling(jobId, {
    interval: 2000,
    onComplete: (result) => {
      setCurrentImage(result);
      setIsGenerating(false);
      setProgress(100);
      toast.success("图片生成成功！");
      if (onSuccess) {
        onSuccess(result);
      }
      // 完成后清空 jobId
      setJobId(null);
    },
    onError: (errorMsg) => {
      setError(errorMsg);
      setIsGenerating(false);
      toast.error("生成失败", {
        description: errorMsg,
      });
      if (onError) {
        onError(new Error(errorMsg));
      }
      // 失败后清空 jobId
      setJobId(null);
    },
    onProgress: (prog) => {
      setProgress(prog);
    },
  });

  const generate = async (request: GenerateImageRequest): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setCurrentImage(null);
    setProgress(0);

    try {
      const res = await generateImgApi(request);
      console.log('[useImageGeneration] API response:', res);

      if (res.code !== 0 || !res.data) {
        const errorMsg = res.msg || "图片生成任务提交失败";
        setError(errorMsg);
        setIsGenerating(false);
        toast.error(errorMsg);
        if (onError) {
          onError(new Error(errorMsg));
        }
        return;
      }

      // 设置 jobId，触发轮询
      console.log('[useImageGeneration] Setting jobId:', res.data.jobId);
      setJobId(res.data.jobId);
      toast.success("任务已提交，正在生成中...", {
        description: `任务ID: ${res.data.jobId}`,
      });
    } catch (err: any) {
      console.error('[useImageGeneration] Error:', err);
      const errorMsg = err.message || "图片生成任务提交失败";
      setError(errorMsg);
      setIsGenerating(false);
      toast.error("提交失败", {
        description: errorMsg,
      });

      if (onError) {
        onError(err);
      }
    }
  };

  const reset = () => {
    setIsGenerating(false);
    setCurrentImage(null);
    setError(null);
    setJobId(null);
    setProgress(0);
  };

  const cancel = async () => {
    if (jobId) {
      await cancelJob();
      setIsGenerating(false);
      setJobId(null);
      setProgress(0);
      toast.info("任务已取消");
    }
  };

  return {
    generate,
    isGenerating: isGenerating || isPolling,
    progress,
    currentImage,
    error,
    reset,
    cancel,
  };
}
