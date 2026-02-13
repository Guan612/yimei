import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PreviewDialogProps {
  previewImage: string | null;
  loadingPreview: boolean;
  onClose: () => void;
}

export function PreviewDialog({
  previewImage,
  loadingPreview,
  onClose,
}: PreviewDialogProps) {
  return (
    <Dialog
      open={!!previewImage || loadingPreview}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>图片预览</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[300px]">
          {loadingPreview ? (
            <div className="text-center space-y-3">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground">加载图片中...</p>
            </div>
          ) : previewImage ? (
            <img
              src={previewImage}
              alt="预览图片"
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
