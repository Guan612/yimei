import { useEffect, useState } from "react";
import { getAllHistoryImgApi } from "@/api/imagegen";
import { getBatchFileUrlsAsAdminApi } from "@/api/upload";
import type { ImageGenerationHistory, PaginatedData } from "@/type/imagegen";
import { toast } from "sonner";

/**
 * 管理员查看所有用户生成记录的Hook
 */
export function useGenerations() {
  const [data, setData] = useState<PaginatedData<ImageGenerationHistory> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async (currentPage = page, currentPageSize = pageSize) => {
    try {
      setLoading(true);
      const response = await getAllHistoryImgApi({
        page: currentPage,
        pageSize: currentPageSize,
      });

      const records = response.data;

      // 批量获取所有文件的 URL
      if (records?.data && records.data.length > 0) {
        const fileIds = records.data.map((record) => record.fileId);

        try {
          const urlsResponse = await getBatchFileUrlsAsAdminApi({
            fileIds,
            expiresIn: 3600 * 3, // 3小时有效期
          });

          if (urlsResponse.code === 0 && urlsResponse.data) {
            // 创建 fileId -> url 的映射
            const urlMap = new Map<number, string>(
              urlsResponse.data.map((item) => [item.fileId, item.url])
            );

            // 将 URL 填充到对应的记录中
            records.data = records.data.map((record) => ({
              ...record,
              file: {
                ...record.file,
                url: urlMap.get(record.fileId) || record.file.url || undefined,
              },
            }));
          }
        } catch (error: any) {
          console.error("批量获取文件URL失败:", error);
          toast.error("部分图片加载失败");
        }
      }

      setData(records);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "加载生成记录失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // 重置到第一页
  };

  return {
    data,
    loading,
    page,
    pageSize,
    loadData,
    handlePageChange,
    handlePageSizeChange,
  };
}
