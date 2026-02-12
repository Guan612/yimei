"use client";

import { useEffect, useState } from "react";
import { getStatsApi } from "@/api/stats";
import type { StatsData } from "@/type/stats";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function StatsOverview() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getStatsApi();
      setStats(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "加载统计数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-muted-foreground">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">暂无统计数据</p>
        <Button className="mt-4" onClick={loadStats}>
          重新加载
        </Button>
      </Card>
    );
  }

  const { imageGeneration, user, chat } = stats;

  return (
    <div className="space-y-6">
      {/* 核心指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              总生成次数
            </span>
            <span className="text-3xl font-bold mt-2">
              {imageGeneration.total.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              成功率: {imageGeneration.successRate}%
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              总成本
            </span>
            <span className="text-3xl font-bold mt-2">
              ${imageGeneration.totalCost.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              美元
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              总用户数
            </span>
            <span className="text-3xl font-bold mt-2">
              {user.total.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              活跃: {user.recentActive}
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              聊天会话
            </span>
            <span className="text-3xl font-bold mt-2">
              {chat.totalSessions.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              消息: {chat.totalMessages.toLocaleString()}
            </span>
          </div>
        </Card>
      </div>

      {/* 详细统计 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Provider统计 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Provider 分布</h3>
          <div className="space-y-3">
            {imageGeneration.byProvider.map((item) => (
              <div key={item.provider} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">{item.provider}</span>
                  <span className="text-sm text-muted-foreground">
                    成本: ${item.cost.toFixed(2)}
                  </span>
                </div>
                <span className="text-xl font-bold">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
            {imageGeneration.byProvider.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无数据
              </p>
            )}
          </div>
        </Card>

        {/* 状态统计 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">生成状态</h3>
          <div className="space-y-3">
            {imageGeneration.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="font-medium capitalize">{item.status}</span>
                <span className="text-xl font-bold">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
            {imageGeneration.byStatus.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无数据
              </p>
            )}
          </div>
        </Card>

        {/* 类型统计 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">生成类型</h3>
          <div className="space-y-3">
            {imageGeneration.byType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="font-medium">{item.type}</span>
                <span className="text-xl font-bold">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
            {imageGeneration.byType.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无数据
              </p>
            )}
          </div>
        </Card>

        {/* 聊天上下文统计 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">聊天上下文</h3>
          <div className="space-y-3">
            {chat.byContext.map((item) => (
              <div key={item.context} className="flex items-center justify-between">
                <span className="font-medium capitalize">{item.context}</span>
                <span className="text-xl font-bold">
                  {item.count.toLocaleString()}
                </span>
              </div>
            ))}
            {chat.byContext.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无数据
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* 趋势图 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">生成趋势（最近30天）</h3>
        {imageGeneration.trend.length > 0 ? (
          <div className="space-y-2">
            {imageGeneration.trend.slice(-10).map((item) => (
              <div key={item.date} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-24">
                  {item.date}
                </span>
                <div className="flex-1 bg-secondary rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{
                      width: `${(item.count / Math.max(...imageGeneration.trend.map(t => t.count))) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-16 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无趋势数据
          </p>
        )}
      </Card>
    </div>
  );
}
