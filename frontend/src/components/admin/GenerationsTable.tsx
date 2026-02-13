"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGenerations } from "@/hooks/admin/useGenerations";
import { useImagePreview } from "@/hooks/admin/useImagePreview";
import { PreviewDialog } from "./GenerationsTable/PreviewDialog";
import { TableHeader } from "./GenerationsTable/TableHeader";
import { TableRow } from "./GenerationsTable/TableRow";
import { TablePagination } from "./GenerationsTable/TablePagination";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

export function GenerationsTable() {
  const {
    data,
    loading,
    page,
    pageSize,
    loadData,
    handlePageChange,
    handlePageSizeChange,
  } = useGenerations();

  const { previewImage, loadingPreview, handleImageClick, closePreview } =
    useImagePreview();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">加载生成记录中...</p>
        </div>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">暂无生成记录</p>
        <Button className="mt-4" onClick={() => loadData()}>
          重新加载
        </Button>
      </Card>
    );
  }

  const { data: records, pagination } = data;

  return (
    <div className="space-y-4">
      <PreviewDialog
        previewImage={previewImage}
        loadingPreview={loadingPreview}
        onClose={closePreview}
      />

      <TableHeader
        total={pagination.total}
        onRefresh={loadData}
        loading={loading}
      />

      {/* 表格 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  预览
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  用户
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prompt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  成本
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  时间
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((record) => (
                <TableRow
                  key={record.id}
                  record={record}
                  onImageClick={handleImageClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 分页 */}
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
