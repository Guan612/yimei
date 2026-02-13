"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactECharts from "echarts-for-react";
import { useStats } from "@/hooks/admin/useStats";
import {
  getProviderChartOption,
  getStatusChartOption,
  getTypeChartOption,
  getTrendChartOption,
  getContextChartOption,
} from "@/utils/chartConfigs";

export function StatsOverview() {
  const { stats, loading, loadStats } = useStats();

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
        <Card className="p-6 bg-linear-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-200 dark:border-blue-900">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              总生成次数
            </span>
            <span className="text-3xl font-bold mt-2 text-blue-700 dark:text-blue-300">
              {imageGeneration.total.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              成功率: {imageGeneration.successRate}%
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-linear-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background border-purple-200 dark:border-purple-900">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
              总成本
            </span>
            <span className="text-3xl font-bold mt-2 text-purple-700 dark:text-purple-300">
              ${imageGeneration.totalCost.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              美元
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-linear-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background border-green-200 dark:border-green-900">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              总用户数
            </span>
            <span className="text-3xl font-bold mt-2 text-green-700 dark:text-green-300">
              {user.total.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              活跃: {user.recentActive}
            </span>
          </div>
        </Card>

        <Card className="p-6 bg-linear-to-br from-cyan-50 to-white dark:from-cyan-950/20 dark:to-background border-cyan-200 dark:border-cyan-900">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
              聊天会话
            </span>
            <span className="text-3xl font-bold mt-2 text-cyan-700 dark:text-cyan-300">
              {chat.totalSessions.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              消息: {chat.totalMessages.toLocaleString()}
            </span>
          </div>
        </Card>
      </div>

      {/* 趋势图 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">生成趋势（最近30天）</h3>
        {imageGeneration.trend.length > 0 ? (
          <ReactECharts
            option={getTrendChartOption(imageGeneration.trend)}
            style={{ height: "300px" }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            暂无趋势数据
          </p>
        )}
      </Card>

      {/* 详细统计 - 图表展示 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Provider统计 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Provider 分布</h3>
          {imageGeneration.byProvider.length > 0 ? (
            <ReactECharts
              option={getProviderChartOption(imageGeneration.byProvider)}
              style={{ height: "320px" }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无数据
            </p>
          )}
        </Card>

        {/* 状态统计 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">生成状态</h3>
          {imageGeneration.byStatus.length > 0 ? (
            <ReactECharts
              option={getStatusChartOption(imageGeneration.byStatus)}
              style={{ height: "320px" }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无数据
            </p>
          )}
        </Card>

        {/* 类型统计 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">生成类型</h3>
          {imageGeneration.byType.length > 0 ? (
            <ReactECharts
              option={getTypeChartOption(imageGeneration.byType)}
              style={{ height: "320px" }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无数据
            </p>
          )}
        </Card>

        {/* 聊天上下文统计 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">聊天上下文</h3>
          {chat.byContext.length > 0 ? (
            <ReactECharts
              option={getContextChartOption(chat.byContext)}
              style={{ height: "320px" }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无数据
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
