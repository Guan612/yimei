import { createFileRoute } from "@tanstack/react-router";

import { ModelConfigList } from '@/components/admin/ModelConfigList';

function AdminModelsPage() {
  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI 模型配置管理</h1>
        <p className="mt-2 text-muted-foreground">
          管理 AI 模型的配置，包括 Provider、API Key、优先级等设置
        </p>
      </div>

      <ModelConfigList />
    </div>
  );
}


export const Route = createFileRoute("/admin/models")({
  component: AdminModelsPage,
});
