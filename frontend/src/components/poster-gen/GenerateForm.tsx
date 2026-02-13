"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ProviderSelector } from "./ProviderSelector";
import { useGenerateForm } from "@/hooks/poster-gen/useGenerateForm";

export function GenerateForm() {
  const {
    // 表单相关
    register,
    onFormSubmit,
    errors,
    // 监听的表单值
    outputFormat,
    steps,
    cfgScale,
    outputCompression,
    // 生成状态
    isGenerating,
    progress,
    cancel,
    // Provider 信息
    isGeminiProvider,
    isOpenAIProvider,
    isGPTImageModel,
    isDallE3,
    // 提示词库
    filteredTerms,
    loadingTerms,
    promptInjectIds,
    injectSearch,
    setInjectSearch,
    toggleInjectId,
    clearSelection,
    selectFiltered,
    // 高级选项
    showAdvanced,
    toggleAdvanced,
  } = useGenerateForm();

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      {/* Provider选择 */}
      <ProviderSelector />

      {/* 提示词 */}
      <div className="space-y-2">
        <Label htmlFor="prompt">提示词（Prompt）*</Label>
        <textarea
          id="prompt"
          className="flex min-h-30 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder="描述你想要生成的海报内容，例如：一张医美诊所的宣传海报，现代简约风格，粉色和白色配色，高端奢华感..."
          disabled={isGenerating}
          {...register("prompt")}
        />
        {errors.prompt && (
          <p className="text-xs text-destructive">{errors.prompt.message}</p>
        )}
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
              <Label htmlFor="injectPosition">注入位置</Label>
              <select
                id="injectPosition"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                disabled={isGenerating}
                {...register("promptInjectPosition")}
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
                onClick={clearSelection}
                disabled={isGenerating || promptInjectIds.length === 0}
              >
                清空已选
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={selectFiltered}
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
                暂无可用提示词，可在"提示词库"管理页添加
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
            勾选后后端会把所选 prompt 注入到 Prompt 前/后，并在生成记录的
            metadata 中保存注入后的 finalPrompt 便于追溯。
          </p>
        </div>
      </div>

      {/* 负面提示词 */}
      <div className="space-y-2">
        <Label htmlFor="negativePrompt">负面提示词（可选）</Label>
        <textarea
          id="negativePrompt"
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder="描述不想要的元素，例如：模糊，低质量，变形，文字错误..."
          disabled={isGenerating}
          {...register("negativePrompt")}
        />
        {errors.negativePrompt && (
          <p className="text-xs text-destructive">
            {errors.negativePrompt.message}
          </p>
        )}
      </div>

      {/* 高级选项 */}
      <div>
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={toggleAdvanced}
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
                disabled={isGenerating}
                {...register("aspectRatio")}
              >
                <option value="1:1">1:1 (正方形)</option>
                <option value="16:9">16:9 (横向)</option>
                <option value="9:16">9:16 (竖向)</option>
                <option value="4:3">4:3 (横向)</option>
                <option value="3:4">3:4 (竖向)</option>
              </select>
            </div>

            {/* Gemini 图片分辨率 - 仅 Gemini Provider 显示 */}
            {isGeminiProvider && (
              <div className="space-y-2">
                <Label htmlFor="imageSize">图片分辨率</Label>
                <select
                  id="imageSize"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={isGenerating}
                  {...register("imageSize")}
                >
                  <option value="">默认 (1K)</option>
                  <option value="1K">1K (1024px)</option>
                  <option value="2K">2K (2048px)</option>
                  <option value="4K">4K (4096px)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  更高分辨率生成时间更长
                </p>
              </div>
            )}

            {/* OpenAI 图片质量 - 仅 OpenAI Provider 显示 */}
            {isOpenAIProvider && (
              <div className="space-y-2">
                <Label htmlFor="quality">图片质量</Label>
                <select
                  id="quality"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={isGenerating}
                  {...register("quality")}
                >
                  <option value="">默认</option>
                  {isGPTImageModel ? (
                    <>
                      <option value="auto">Auto (自动)</option>
                      <option value="high">High (高质量)</option>
                      <option value="medium">Medium (中等)</option>
                      <option value="low">Low (低质量)</option>
                    </>
                  ) : isDallE3 ? (
                    <>
                      <option value="hd">HD (高清)</option>
                      <option value="standard">Standard (标准)</option>
                    </>
                  ) : (
                    <>
                      <option value="auto">Auto (自动)</option>
                      <option value="high">High (高质量)</option>
                      <option value="medium">Medium (中等)</option>
                      <option value="low">Low (低质量)</option>
                      <option value="hd">HD (DALL-E 3)</option>
                      <option value="standard">Standard (DALL-E 3)</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-muted-foreground">
                  {isGPTImageModel
                    ? "GPT image models 质量参数"
                    : isDallE3
                      ? "DALL-E 3 质量参数"
                      : "根据模型自动适配"}
                </p>
              </div>
            )}

            {/* OpenAI GPT image models 特有参数 */}
            {isGPTImageModel && (
              <>
                {/* 输出格式 */}
                <div className="space-y-2">
                  <Label htmlFor="outputFormat">输出格式</Label>
                  <select
                    id="outputFormat"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={isGenerating}
                    {...register("outputFormat")}
                  >
                    <option value="">默认 (PNG)</option>
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WebP</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    PNG 和 WebP 支持透明背景
                  </p>
                </div>

                {/* 背景透明度 */}
                <div className="space-y-2">
                  <Label htmlFor="background">背景透明度</Label>
                  <select
                    id="background"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={isGenerating}
                    {...register("background")}
                  >
                    <option value="">默认 (Auto)</option>
                    <option value="auto">Auto (自动)</option>
                    <option value="transparent">Transparent (透明)</option>
                    <option value="opaque">Opaque (不透明)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    透明背景需要使用 PNG 或 WebP 格式
                  </p>
                </div>

                {/* 压缩级别 */}
                {(outputFormat === "jpeg" || outputFormat === "webp") && (
                  <div className="space-y-2">
                    <Label htmlFor="outputCompression">
                      压缩级别: {outputCompression ?? 100}
                    </Label>
                    <Input
                      type="range"
                      id="outputCompression"
                      min="0"
                      max="100"
                      disabled={isGenerating}
                      {...register("outputCompression", { valueAsNumber: true })}
                    />
                    {errors.outputCompression && (
                      <p className="text-xs text-destructive">
                        {errors.outputCompression.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      降低压缩级别可减小文件大小
                    </p>
                  </div>
                )}
              </>
            )}

            {/* 生成步数 */}
            <div className="space-y-2">
              <Label htmlFor="steps">生成步数: {steps}</Label>
              <Input
                type="range"
                id="steps"
                min="10"
                max="150"
                disabled={isGenerating}
                {...register("steps", { valueAsNumber: true })}
              />
              {errors.steps && (
                <p className="text-xs text-destructive">{errors.steps.message}</p>
              )}
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
                disabled={isGenerating}
                {...register("cfgScale", { valueAsNumber: true })}
              />
              {errors.cfgScale && (
                <p className="text-xs text-destructive">
                  {errors.cfgScale.message}
                </p>
              )}
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
            type="submit"
            disabled={isGenerating}
            className="flex-1"
            size="lg"
          >
            {isGenerating ? `生成中 ${progress}%` : "生成海报"}
          </Button>
          {isGenerating && (
            <Button type="button" onClick={cancel} variant="outline" size="lg">
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
    </form>
  );
}
