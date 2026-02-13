import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { GenerationDetail } from "@/components/poster-gen/GenerationDetail";
import { getByIdImgApi } from "@/api/imagegen";
import type { ImageGenerationHistory } from "@/type/imagegen";

function GenerationDetailPage() {
  const { id } = Route.useParams();
  const [detail, setDetail] = useState<ImageGenerationHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        const res = await getByIdImgApi(Number(id));

        if (res.code === 0 && res.data) {
          setDetail(res.data);
        } else {
          setError(res.msg || "加载失败");
        }
      } catch (err: any) {
        setError(err.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Card className="flex aspect-square items-center justify-center bg-muted">
          <div className="text-center space-y-4">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Card className="flex aspect-square items-center justify-center bg-destructive/10 border-destructive/20">
          <div className="text-center space-y-2 p-6">
            <p className="text-destructive font-medium">加载失败</p>
            <p className="text-sm text-muted-foreground">
              {error || "未找到该记录"}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <GenerationDetail detail={detail} />;
}

export const Route = createFileRoute("/_app/poster-gen/$id")({
  component: GenerationDetailPage,
});
