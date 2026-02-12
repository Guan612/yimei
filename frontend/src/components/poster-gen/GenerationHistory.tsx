"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGenerationHistory } from "@/hooks/poster-gen";

export function GenerationHistory() {
  const { history, loadHistory, handleViewImage } = useGenerationHistory();

  if (history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">暂无生成历史</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">
                  {item.prompt}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.provider}</span>
                  <span>•</span>
                  <span>{item.type}</span>
                  <span>•</span>
                  <span>
                    {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewImage(item)}
              >
                查看
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {history.length >= 10 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => loadHistory()}
        >
          加载更多
        </Button>
      )}
    </div>
  );
}
