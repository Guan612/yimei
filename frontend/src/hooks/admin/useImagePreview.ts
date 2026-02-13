import { useState } from "react";
import { getFileUrlAsAdminApi } from "@/api/upload";
import { toast } from "sonner";

export function useImagePreview() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const handleImageClick = async (fileId: number) => {
    try {
      setLoadingPreview(true);
      const response = await getFileUrlAsAdminApi(fileId);
      if (response.code === 0 && response.data?.url) {
        setPreviewImage(response.data.url);
      } else {
        toast.error(response.msg || "获取图片失败");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "获取图片失败");
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return {
    previewImage,
    loadingPreview,
    handleImageClick,
    closePreview,
  };
}
