"use client";

import { useFaceSimEditForm } from "@/hooks/facesim";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MEDICAL_AESTHETICS_CATEGORIES } from "@/type/medicalAesthetics";

export function FaceSimEditForm() {
  const {
    fileInputRef,
    originalImage,
    selectedArea,
    editPrompt,
    isProcessing,
    isDragging,
    selectedCategory,
    showTerms,
    includeLocationInPrompt,
    setEditPrompt,
    setSelectedCategory,
    setShowTerms,
    setIncludeLocationInPrompt,
    handleFileInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleGenerate,
    handleReset,
    handleSelectTerm,
    filteredTerms,
  } = useFaceSimEditForm();

  return (
    <div className="space-y-6">
      {/* 图片上传 */}
      <div className="space-y-2">
        <Label>上传图片*</Label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          } ${originalImage ? "bg-muted/30" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
            disabled={isProcessing}
          />

          {originalImage ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">图片已上传</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                重新上传
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  选择图片
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  或拖放图片到此处
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 编辑提示词 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="editPrompt">编辑提示词*</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTerms(!showTerms)}
            className="text-xs h-7"
          >
            {showTerms ? "隐藏" : "显示"}术语库
          </Button>
        </div>

        {/* 医美术语快捷选择 */}
        {showTerms && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                💡 支持叠加选择多个术语
              </p>
            </div>

            {/* 分类选择 */}
            <div className="flex gap-1.5 flex-wrap">
              {MEDICAL_AESTHETICS_CATEGORIES.filter(
                (cat) => cat.id !== "poster",
              ).map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="h-7 text-xs"
                  disabled={isProcessing}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* 术语列表 */}
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {filteredTerms.map((term) => (
                <button
                  key={term.id}
                  onClick={() => handleSelectTerm(term)}
                  disabled={isProcessing}
                  className="text-left p-2 rounded-md border bg-background hover:bg-accent hover:border-primary transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title={term.description}
                >
                  <div className="font-medium">{term.label}</div>
                  <div className="text-muted-foreground text-[10px] line-clamp-1 mt-0.5">
                    {term.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          id="editPrompt"
          className="flex min-h-30 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder="描述你想要对选中区域进行的修改，例如：将这部分皮肤变得更光滑，去除痘印... 或点击上方快速选择常用医美术语"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          disabled={isProcessing}
        />

        {/* 选区位置选项 */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLocationInPrompt}
              onChange={(e) => setIncludeLocationInPrompt(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              disabled={isProcessing}
            />
            <span className="text-xs text-muted-foreground">
              自动添加选区位置信息到提示词（帮助AI更准确定位）
            </span>
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          请先在右侧图片上框选区域，然后选择术语或输入修改描述
        </p>
      </div>

      {/* 使用提示 */}
      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          使用说明
        </h4>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>上传一张照片</li>
          <li>选择绘制模式（矩形框选或自由绘制）</li>
          <li>在右侧预览图上绘制需要编辑的区域</li>
          <li>从术语库选择医美术语，或自己输入修改描述</li>
          <li>点击"生成编辑"按钮</li>
        </ol>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          disabled={isProcessing || !originalImage || !editPrompt.trim()}
          className="flex-1"
          size="lg"
        >
          {isProcessing ? "生成中..." : "生成编辑"}
        </Button>
        {originalImage && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isProcessing}
            size="lg"
          >
            重置
          </Button>
        )}
      </div>
    </div>
  );
}
