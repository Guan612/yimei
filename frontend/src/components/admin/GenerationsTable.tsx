"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGenerations } from "@/hooks/admin/useGenerations";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Image as ImageIcon,
  User,
} from "lucide-react";

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

  // 状态标签映射
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      completed: { label: "完成", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      pending: { label: "待处理", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
      generating: { label: "生成中", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      failed: { label: "失败", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    };

    const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Provider标签
  const getProviderBadge = (provider: string) => {
    const providerMap: Record<string, { className: string }> = {
      stability: { className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
      openai: { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
      aliyun: { className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
      gemini: { className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
    };

    const config = providerMap[provider.toLowerCase()] || { className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {provider}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          共 {pagination.total} 条记录
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData()}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

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
                <tr
                  key={record.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    {record.file?.url ? (
                      <img
                        src={record.file.url}
                        alt="preview"
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <div className="font-medium">
                          {record.user?.nickname || record.user?.loginId || `用户 ${record.userId}`}
                        </div>
                        {record.user?.loginId && record.user?.nickname && (
                          <div className="text-xs text-muted-foreground">
                            {record.user.loginId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-sm line-clamp-2" title={record.prompt}>
                      {record.prompt}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getProviderBadge(record.provider)}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {record.cost !== null && record.cost !== undefined
                      ? `$${record.cost.toFixed(4)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {dayjs(record.createdAt).fromNow()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">每页显示</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm bg-background"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-muted-foreground">条</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            第 {pagination.page} / {pagination.totalPages} 页
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
