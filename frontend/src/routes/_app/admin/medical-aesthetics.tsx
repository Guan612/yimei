import { createFileRoute } from "@tanstack/react-router";

import { MedicalAestheticsConfig } from '@/components/admin/medicalAestheticsConfig';

function AdminMedicalAestheticsPage() {
  return (
    <div className="container mx-auto px-8 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">医美术语配置管理</h1>
        <p className="mt-2 text-muted-foreground">
          管理医美相关的术语标签和提示词，用于图像生成功能
        </p>
      </div>

      <MedicalAestheticsConfig />
    </div>
  );
}


export const Route = createFileRoute("/_app/admin/medical-aesthetics")({
  component: AdminMedicalAestheticsPage,
});
