"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import type { ImageGenerationHistory } from "@/type/imagegen";
import { buildImageUrl, downloadImage } from "@/utils/imageUtils";

interface GenerationDetailProps {
  detail: ImageGenerationHistory;
}

export function GenerationDetail({ detail }: GenerationDetailProps) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 优先使用后端返回的签名URL，否则自己构建
  const imageUrl = (detail.file as any).url || buildImageUrl(detail.file.key);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const filename = `poster-${detail.id}-${Date.now()}.${detail.file.contentType.split("/")[1] || "png"}`;
      await downloadImage(imageUrl, filename);
      toast.success("图片下载成功！");
    } catch (error) {
      toast.error("下载失败，请重试");
    } finally {
      setDownloading(false);
    }
  };

  const handleBack = () => {
    navigate({ to: "/poster-gen" });
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      toast.error("图片加载失败");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回列表
      </Button>

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-[var(--charcoal)] mb-2">
          生成详情
        </h1>
        <p className="text-[var(--warm-gray)] text-base">
          查看生成记录的完整信息
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：图片预览 */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center text-center p-6">
                  <div className="space-y-2">
                    <svg
                      className="h-16 w-16 mx-auto text-muted-foreground/50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                    <p className="text-sm text-muted-foreground">图片加载失败</p>
                    <p className="text-xs text-muted-foreground">
                      文件路径：{detail.file.key}
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="Generated poster"
                  className="w-full h-full object-contain"
                  onError={handleImageError}
                />
              )}
            </div>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              variant="default"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "下载中..." : "下载图片"}
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                新标签页打开
              </a>
            </Button>
          </div>

          {/* 文件信息 */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-[var(--charcoal)] mb-3">
              文件信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">文件类型</span>
                <span className="font-medium">{detail.file.contentType}</span>
              </div>
              {detail.file.size && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">文件大小</span>
                  <span className="font-medium">
                    {(detail.file.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">状态</span>
                <span className="font-medium">{detail.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">类型</span>
                <span className="font-medium">{detail.type}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧：详细信息 */}
        <div className="space-y-4">
          {/* 基本信息 */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-[var(--charcoal)] mb-4">
              基本信息
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">提示词</label>
                <p className="mt-1 text-sm font-medium whitespace-pre-wrap">
                  {detail.prompt}
                </p>
              </div>

              {detail.negativePrompt && (
                <div>
                  <label className="text-sm text-muted-foreground">
                    反向提示词
                  </label>
                  <p className="mt-1 text-sm font-medium whitespace-pre-wrap">
                    {detail.negativePrompt}
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Provider
                  </label>
                  <p className="mt-1 text-sm font-medium">{detail.provider}</p>
                </div>
                {detail.model && (
                  <div>
                    <label className="text-sm text-muted-foreground">
                      模型
                    </label>
                    <p className="mt-1 text-sm font-medium">{detail.model}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  生成时间
                </label>
                <p className="mt-1 text-sm font-medium">
                  {new Date(detail.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </Card>

          {/* 提示词注入信息 */}
          {detail.metadata?.promptInjection && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-[var(--charcoal)] mb-4">
                提示词注入
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">
                    注入位置
                  </label>
                  <p className="mt-1 text-sm font-medium">
                    {detail.metadata.promptInjection.position === "prepend"
                      ? "前置"
                      : "后置"}
                  </p>
                </div>

                {detail.metadata.promptInjection.injectedPrompts && (
                  <div>
                    <label className="text-sm text-muted-foreground">
                      注入的提示词
                    </label>
                    <div className="mt-2 space-y-2">
                      {detail.metadata.promptInjection.injectedPrompts.map(
                        (prompt, index) => (
                          <div
                            key={index}
                            className="p-3 bg-muted rounded-lg text-sm"
                          >
                            {prompt}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {detail.metadata.promptInjection.finalPrompt && (
                  <div>
                    <label className="text-sm text-muted-foreground">
                      最终提示词
                    </label>
                    <div className="mt-2 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                      {detail.metadata.promptInjection.finalPrompt}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 生成参数 */}
          {detail.parameters && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-[var(--charcoal)] mb-4">
                生成参数
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detail.parameters.steps && (
                  <div>
                    <label className="text-muted-foreground">步数</label>
                    <p className="mt-1 font-medium">
                      {detail.parameters.steps}
                    </p>
                  </div>
                )}
                {detail.parameters.cfgScale && (
                  <div>
                    <label className="text-muted-foreground">CFG Scale</label>
                    <p className="mt-1 font-medium">
                      {detail.parameters.cfgScale}
                    </p>
                  </div>
                )}
                {detail.parameters.samples && (
                  <div>
                    <label className="text-muted-foreground">样本数</label>
                    <p className="mt-1 font-medium">
                      {detail.parameters.samples}
                    </p>
                  </div>
                )}
                {detail.parameters.aspectRatio && (
                  <div>
                    <label className="text-muted-foreground">宽高比</label>
                    <p className="mt-1 font-medium">
                      {detail.parameters.aspectRatio}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
