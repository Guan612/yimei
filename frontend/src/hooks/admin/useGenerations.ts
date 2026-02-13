import { useEffect, useState } from "react";
import { getAllHistoryImgApi } from "@/api/imagegen";
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
      setData(response.data);
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
