import { createFileRoute } from "@tanstack/react-router";

import { ProviderConfigList } from '@/components/admin/ProviderConfigList';

function AdminProvidersPage() {
  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Provider 配置管理</h1>
        <p className="mt-2 text-muted-foreground">
          管理 AI 图像生成服务的配置，包括 API Key、优先级等
        </p>
      </div>

      <ProviderConfigList />
    </div>
  );
}


export const Route = createFileRoute("/admin/providers")({
  component: AdminProvidersPage,
});
