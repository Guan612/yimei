"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  generationHistoryAtom,
  currentGeneratedImageAtom,
} from "@/store/imageGen";
import { getHistoryImgApi, getByIdImgApi } from "@/api/imagegen";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function GenerationHistory() {
  const [history, setHistory] = useAtom(generationHistoryAtom);
  const setCurrentImage = useSetAtom(currentGeneratedImageAtom);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getHistoryImgApi(10, 0);
      if (res.code === 0) {
        toast.success("加载成功");
        setHistory(res.data || []);
      }
    } catch (error: any) {
      toast.error("加载历史记录失败", {
        description: error.message,
      });
    }
  };

  const handleViewImage = async (historyItem: any) => {
    try {
      const { data, code, msg } = await getByIdImgApi(historyItem.id);

      if (!data || code !== 0) {
        toast.error(msg);
        return;
      }
      const detail = data;
      // 从detail构造currentImage格式
      setCurrentImage({
        id: detail.id,
        imageUrl: detail.file.key, // 需要转换为完整URL
        provider: detail.provider,
        configId: 0, // 历史记录可能没有configId
        model: detail.model,
        createdAt: detail.createdAt,
      });

      // 滚动到顶部查看图片
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      toast.error("加载图片失败", {
        description: error.message,
      });
    }
  };

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
        <Button variant="outline" className="w-full" onClick={loadHistory}>
          加载更多
        </Button>
      )}
    </div>
  );
}
