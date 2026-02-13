"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGenerationHistory } from "@/hooks/poster-gen";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export function GenerationHistory() {
  const { history, pagination, loadHistory, handleViewImage } = useGenerationHistory();
  const [currentPage, setCurrentPage] = useState(1);

  // 加载当前页数据
  useEffect(() => {
    loadHistory({ page: currentPage, pageSize: ITEMS_PER_PAGE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // 处理页码变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">暂无生成历史</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 历史记录列表 */}
      <div className="space-y-3">
        {history.map((item) => (
          <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {item.prompt}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.provider}</span>
                    <span>•</span>
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewImage(item)}
                >
                  查看
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 分页控件 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-end pt-2 border-t gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>第 {pagination.page} 页</span>
            <span>•</span>
            <span>共 {pagination.totalPages} 页</span>
            <span>•</span>
            <span>共 {pagination.total} 条</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="gap-1"
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
