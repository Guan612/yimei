import { createFileRoute } from "@tanstack/react-router";

function AdminStatsPage() {
  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">生成统计</h1>
        <p className="mt-2 text-muted-foreground">
          查看图片生成统计、成本分析和使用趋势
        </p>
      </div>

      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">统计功能开发中...</p>
      </div>
    </div>
  );
}


export const Route = createFileRoute("/_app/admin/stats")({
  component: AdminStatsPage,
});
