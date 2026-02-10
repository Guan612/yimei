"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtom } from "jotai";
import {
  selectedProviderIdAtom,
} from "@/store/imageGen";
import { useImageGeneration } from "@/hooks/poster-gen/useImageGeneration";
import type { GenerateImageRequest } from "@/type/imagegen";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ProviderSelector } from "./ProviderSelector";
import {
  MEDICAL_AESTHETICS_CATEGORIES,
  MedicalAestheticsTerm,
} from "@/type/medicalAesthetics";
import { medicalAestheticsListApi } from "@/api/medicalAesthetics";

export function GenerateForm() {
  const [selectedProviderId] = useAtom(selectedProviderIdAtom);
  const { generate, isGenerating, progress, cancel } = useImageGeneration();
  const [terms, setTerms] = useState<MedicalAestheticsTerm[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [promptInjectIds, setPromptInjectIds] = useState<number[]>([]);
  const [promptInjectPosition, setPromptInjectPosition] = useState<
    "prepend" | "append"
  >("prepend");
  const [injectCategory, setInjectCategory] = useState<string>("all");
  const [injectSearch, setInjectSearch] = useState("");

  // 高级选项
  const [aspectRatio, setAspectRatio] = useState<
    "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  >("1:1");
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7);

  const filteredTerms = useMemo(() => {
    const search = injectSearch.trim().toLowerCase();
    return (terms || [])
      .filter((t) =>
        injectCategory === "all" ? true : t.category === injectCategory,
      )
      .filter((t) => {
        if (!search) return true;
        const hay = `${t.label ?? ""} ${t.prompt ?? ""} ${t.description ?? ""}`
          .toLowerCase()
          .trim();
        return hay.includes(search);
      })
      .sort((a, b) => {
        if (a.category !== b.category)
          return a.category.localeCompare(b.category);
        return (a.label || "").localeCompare(b.label || "");
      });
  }, [terms, injectCategory, injectSearch]);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        setLoadingTerms(true);
        const res = await medicalAestheticsListApi();
        if (res.code !== 0) {
          toast.error(res.msg || "加载提示词库失败");
          setTerms([]);
          return;
        }
        setTerms((res.data as any) || []);
      } catch (e: any) {
        toast.error("加载提示词库失败", {
          description: e?.message,
        });
      } finally {
        setLoadingTerms(false);
      }
    };

    loadTerms();
  }, []);

  const toggleInjectId = (id: number, checked: boolean) => {
    setPromptInjectIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("请输入提示词");
      return;
    }

    const requestData: GenerateImageRequest = {
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim() || undefined,
      configId: selectedProviderId,
      aspectRatio,
      steps,
      cfgScale,
      ...(promptInjectIds.length > 0
        ? {
            promptInjectIds,
            promptInjectPosition,
          }
        : {}),
    };

    await generate(requestData);
  };

  return (
    <div className="space-y-6">
      {/* Provider选择 */}
      <ProviderSelector />

      {/* 提示词 */}
      <div className="space-y-2">
        <Label htmlFor="prompt">提示词（Prompt）*</Label>
        <textarea
          id="prompt"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder="描述你想要生成的海报内容，例如：一张医美诊所的宣传海报，现代简约风格，粉色和白色配色，高端奢华感..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          详细描述能得到更好的效果
        </p>
      </div>

      {/* 提示词库注入 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label>提示词库（可选）</Label>
          <div className="text-xs text-muted-foreground">
            已选择 {promptInjectIds.length} 条
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="injectCategory">类别</Label>
              <select
                id="injectCategory"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={injectCategory}
                onChange={(e) => setInjectCategory(e.target.value)}
                disabled={isGenerating}
              >
                <option value="all">全部</option>
                {MEDICAL_AESTHETICS_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="injectPosition">注入位置</Label>
              <select
                id="injectPosition"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={promptInjectPosition}
                onChange={(e) => setPromptInjectPosition(e.target.value as any)}
                disabled={isGenerating}
              >
                <option value="prepend">前置（推荐）</option>
                <option value="append">后置</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="injectSearch">搜索</Label>
              <Input
                id="injectSearch"
                value={injectSearch}
                onChange={(e) => setInjectSearch(e.target.value)}
                placeholder="搜索 label / prompt / description"
                disabled={isGenerating}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPromptInjectIds([])}
                disabled={isGenerating || promptInjectIds.length === 0}
              >
                清空已选
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const ids = filteredTerms.map((t) => t.id);
                  setPromptInjectIds(
                    Array.from(new Set([...promptInjectIds, ...ids])),
                  );
                }}
                disabled={isGenerating || filteredTerms.length === 0}
              >
                全选当前筛选
              </Button>
            </div>
          </div>

          <div className="max-h-56 overflow-auto rounded-md border bg-background">
            {loadingTerms ? (
              <div className="p-3 text-sm text-muted-foreground">加载中...</div>
            ) : filteredTerms.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">
                暂无可用提示词，可在“提示词库”管理页添加
              </div>
            ) : (
              <div className="divide-y">
                {filteredTerms.map((t) => {
                  const checked = promptInjectIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={checked}
                        onChange={(e) => toggleInjectId(t.id, e.target.checked)}
                        disabled={isGenerating}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium">
                            {t.label}
                          </div>
                          <div className="shrink-0 text-xs text-muted-foreground">
                            #{t.id}
                          </div>
                        </div>
                        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {t.prompt}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            勾选后后端会把所选 prompt 注入到 Prompt 前/后，并在生成记录的 metadata
            中保存注入后的 finalPrompt 便于追溯。
          </p>
        </div>
      </div>

      {/* 负面提示词 */}
      <div className="space-y-2">
        <Label htmlFor="negativePrompt">负面提示词（可选）</Label>
        <textarea
          id="negativePrompt"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder="描述不想要的元素，例如：模糊，低质量，变形，文字错误..."
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          disabled={isGenerating}
        />
      </div>

      {/* 高级选项 */}
      <div>
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "隐藏" : "显示"}高级选项
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 rounded-lg border p-4">
            {/* 宽高比 */}
            <div className="space-y-2">
              <Label htmlFor="aspectRatio">宽高比</Label>
              <select
                id="aspectRatio"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                disabled={isGenerating}
              >
                <option value="1:1">1:1 (正方形)</option>
                <option value="16:9">16:9 (横向)</option>
                <option value="9:16">9:16 (竖向)</option>
                <option value="4:3">4:3 (横向)</option>
                <option value="3:4">3:4 (竖向)</option>
              </select>
            </div>

            {/* 生成步数 */}
            <div className="space-y-2">
              <Label htmlFor="steps">生成步数: {steps}</Label>
              <Input
                type="range"
                id="steps"
                min="10"
                max="150"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                步数越多质量越好，但生成时间越长
              </p>
            </div>

            {/* CFG Scale */}
            <div className="space-y-2">
              <Label htmlFor="cfgScale">CFG Scale: {cfgScale}</Label>
              <Input
                type="range"
                id="cfgScale"
                min="1"
                max="20"
                value={cfgScale}
                onChange={(e) => setCfgScale(Number(e.target.value))}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                控制AI对提示词的遵循程度，7-10为推荐值
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 生成按钮和进度 */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1"
            size="lg"
          >
            {isGenerating ? `生成中 ${progress}%` : "生成海报"}
          </Button>
          {isGenerating && (
            <Button
              onClick={cancel}
              variant="outline"
              size="lg"
            >
              取消
            </Button>
          )}
        </div>
        {isGenerating && progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
