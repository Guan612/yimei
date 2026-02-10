import { useState, useEffect, useRef } from "react";
import { getJobStatusApi, cancelJobApi } from "@/api/imagegen";
import type {
  JobStatusResponse,
  ImageGenerationResponse,
  NestedResultResponse
} from "@/type/imagegen";

/**
 * 类型守卫：检查是否为嵌套响应结构
 */
function isNestedResult(
  result: ImageGenerationResponse | NestedResultResponse<ImageGenerationResponse>
): result is NestedResultResponse<ImageGenerationResponse> {
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    'data' in result &&
    typeof (result as NestedResultResponse<ImageGenerationResponse>).success === 'boolean'
  );
}

export interface UseJobPollingOptions {
  /** 轮询间隔（毫秒），默认 2000ms */
  interval?: number;
  /** 任务完成时的回调 */
  onComplete?: (result: ImageGenerationResponse) => void;
  /** 任务失败时的回调 */
  onError?: (error: string) => void;
  /** 进度更新回调 */
  onProgress?: (progress: number) => void;
}

export interface UseJobPollingReturn {
  /** 任务状态 */
  jobStatus: JobStatusResponse | null;
  /** 是否正在轮询 */
  isPolling: boolean;
  /** 错误信息 */
  error: string | null;
  /** 取消任务 */
  cancelJob: () => Promise<void>;
  /** 手动刷新状态 */
  refresh: () => Promise<void>;
}

/**
 * 异步任务轮询 Hook
 *
 * @param jobId 任务ID
 * @param options 配置选项
 * @returns 任务状态和控制方法
 *
 * @example
 * ```tsx
 * const { jobStatus, isPolling, error, cancelJob } = useJobPolling(jobId, {
 *   interval: 2000,
 *   onComplete: (result) => {
 *     console.log('任务完成', result);
 *   },
 *   onProgress: (progress) => {
 *     console.log('进度:', progress);
 *   }
 * });
 * ```
 */
export function useJobPolling(
  jobId: string | null,
  options: UseJobPollingOptions = {}
): UseJobPollingReturn {
  const {
    interval = 2000,
    onComplete,
    onError,
    onProgress,
  } = options;

  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousProgress, setPreviousProgress] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 查询任务状态
  const fetchJobStatus = async () => {
    if (!jobId) return;

    console.log('[useJobPolling] Fetching status for jobId:', jobId);

    try {
      const res = await getJobStatusApi(jobId);
      console.log('[useJobPolling] API response:', res);

      if (res.code !== 0 || !res.data) {
        throw new Error(res.msg || "查询任务状态失败");
      }

      const status = res.data;
      console.log('[useJobPolling] Job status:', status);
      setJobStatus(status);

      // 进度更新回调
      if (onProgress && status.progress !== previousProgress) {
        console.log('[useJobPolling] Progress updated:', status.progress);
        onProgress(status.progress);
        setPreviousProgress(status.progress);
      }

      // 任务完成
      if (status.status === "completed") {
        console.log('[useJobPolling] Job completed!');
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (onComplete && status.result) {
          // 处理嵌套的响应结构 { success: true, data: {...} }
          const result = isNestedResult(status.result) && status.result.success
            ? status.result.data
            : status.result;
          console.log('[useJobPolling] Calling onComplete with result:', result);
          onComplete(result);
        }
      }

      // 任务失败
      if (status.status === "failed") {
        console.log('[useJobPolling] Job failed:', status.error);
        setIsPolling(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const errorMsg = status.error || "任务执行失败";
        setError(errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      }
    } catch (err) {
      console.error('[useJobPolling] Error fetching status:', err);
      const errorMsg = err instanceof Error ? err.message : "查询任务状态失败";
      setError(errorMsg);
      setIsPolling(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  // 开始轮询
  useEffect(() => {
    console.log('[useJobPolling] jobId changed:', jobId);

    if (!jobId) {
      setIsPolling(false);
      return;
    }

    console.log('[useJobPolling] Starting polling for jobId:', jobId);
    setIsPolling(true);
    setError(null);
    setPreviousProgress(0);

    // 立即查询一次
    fetchJobStatus();

    // 设置定时轮询
    timerRef.current = setInterval(() => {
      console.log('[useJobPolling] Polling...');
      fetchJobStatus();
    }, interval);

    // 清理函数
    return () => {
      console.log('[useJobPolling] Cleanup for jobId:', jobId);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, interval]);

  // 取消任务
  const cancelJob = async () => {
    if (!jobId) return;

    try {
      await cancelJobApi(jobId);
      setIsPolling(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "取消任务失败";
      throw new Error(errorMsg);
    }
  };

  // 手动刷新
  const refresh = async () => {
    await fetchJobStatus();
  };

  return {
    jobStatus,
    isPolling,
    error,
    cancelJob,
    refresh,
  };
}
