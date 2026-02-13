import { createFileRoute } from "@tanstack/react-router";
import { GenerationsTable } from "@/components/admin/GenerationsTable";

function AdminGenerationsPage() {
  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">用户生成记录</h1>
        <p className="mt-2 text-muted-foreground">
          查看所有用户的图片生成历史记录
        </p>
      </div>

      <GenerationsTable />
    </div>
  );
}


export const Route = createFileRoute("/_app/admin/generations")({
  component: AdminGenerationsPage,
});
