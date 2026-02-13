import { createFileRoute } from "@tanstack/react-router";

import { GenerateForm } from '@/components/poster-gen/GenerateForm';
import { ImagePreview } from '@/components/poster-gen/ImagePreview';
import { GenerationHistory } from '@/components/poster-gen/GenerationHistory';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function PosterGenPage() {
  return (
    <>
      {/* 页面标题 */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--rose-gold-pale)] text-[var(--rose-gold)] text-sm mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
          AI 海报生成
        </div>
        <h1 className="text-3xl font-light text-[var(--charcoal)] mb-2">
          BrandGuard 海报生成器
        </h1>
        <p className="text-[var(--warm-gray)] text-base">
          使用 AI 技术快速生成专业的医美海报设计
        </p>
      </section>

      {/* 主要内容区域 */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-[var(--charcoal)] mb-5">生成设置</h2>
            <GenerateForm />
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium text-[var(--charcoal)] mb-5">预览结果</h2>
            <ImagePreview />
          </Card>
        </div>
      </section>

      {/* 历史记录 */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <Separator className="mb-8" />
        <h2 className="text-xl font-light text-[var(--charcoal)] mb-6">生成历史</h2>
        <GenerationHistory />
      </section>
    </>
  );
}


export const Route = createFileRoute("/_app/poster-gen/")({
  component: PosterGenPage,
});
