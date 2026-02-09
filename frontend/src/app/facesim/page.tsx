'use client';

import { AppHeader } from '@/components/layout/AppHeader';
import { FaceSimEditForm } from '@/components/facesim/FaceSimEditForm';
import { SelectableImagePreview } from '@/components/facesim/SelectableImagePreview';
import { Card } from '@/components/ui/card';

export default function FaceSimPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <AppHeader />

      {/* 页面标题 */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--rose-gold-pale)] text-[var(--rose-gold)] text-sm mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          AI 图片编辑
        </div>
        <h1 className="text-3xl font-light text-[var(--charcoal)] mb-2">
          FaceSim 图片编辑器
        </h1>
        <p className="text-[var(--warm-gray)] text-base">
          上传图片，自由绘制或框选区域，选择医美术语或输入描述，AI 智能编辑图片局部内容
        </p>
      </section>

      {/* 主要内容区域 */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex gap-6">
          <Card className="p-6 w-80 shrink-0">
            <h2 className="text-lg font-medium text-[var(--charcoal)] mb-5">编辑设置</h2>
            <FaceSimEditForm />
          </Card>

          <Card className="p-6 flex-1">
            <h2 className="text-lg font-medium text-[var(--charcoal)] mb-5">图片预览</h2>
            <SelectableImagePreview />
          </Card>
        </div>
      </section>
    </div>
  );
}
