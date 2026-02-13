import { PosterPromptConfig } from "@/components/admin/posterPromptConfig";
import { createFileRoute } from "@tanstack/react-router";


function AdminPosterPromptsPage() {
  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">海报提示词配置管理</h1>
        <p className="mt-2 text-muted-foreground">
          管理海报生成相关的提示词配置，用于图像生成功能
        </p>
      </div>

      <PosterPromptConfig />
    </div>
  );
}


export const Route = createFileRoute("/_app/admin/poster-prompts")({
  component: AdminPosterPromptsPage,
});
