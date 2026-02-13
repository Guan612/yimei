import { Image as ImageIcon, User } from "lucide-react";
import { getStatusBadge, getProviderBadge } from "../generationHelpers";
import dayjs from "dayjs";

interface GenerationRecord {
  id: number;
  fileId: number;
  userId: number;
  prompt: string;
  provider: string;
  status: string;
  cost: number | null;
  createdAt: string;
  file?: {
    key: string;
    url?: string;
  };
  user?: {
    nickname?: string;
    loginId?: string;
  };
}

interface TableRowProps {
  record: GenerationRecord;
  onImageClick: (fileId: number) => void;
}

export function TableRow({ record, onImageClick }: TableRowProps) {
  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        {record.file?.key ? (
          <div
            className="w-16 h-16 bg-muted rounded border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onImageClick(record.fileId)}
            title="点击预览图片"
          >
            {record.file.url ? (
              <img
                src={record.file.url}
                alt={record.prompt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 加载失败时显示图标
                  const target = e.target as HTMLElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.className =
                      "w-16 h-16 bg-muted rounded border flex items-center justify-center cursor-pointer";
                    const icon = document.createElement("div");
                    icon.innerHTML = `<svg class="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
                    parent.appendChild(icon.firstElementChild!);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <div className="font-medium">
              {record.user?.nickname ||
                record.user?.loginId ||
                `用户 ${record.userId}`}
            </div>
            {record.user?.loginId && record.user?.nickname && (
              <div className="text-xs text-muted-foreground">
                {record.user.loginId}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 max-w-xs">
        <div className="text-sm line-clamp-2" title={record.prompt}>
          {record.prompt}
        </div>
      </td>
      <td className="px-4 py-3">{getProviderBadge(record.provider)}</td>
      <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
      <td className="px-4 py-3 text-sm">
        {record.cost !== null && record.cost !== undefined
          ? `$${record.cost.toFixed(4)}`
          : "-"}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {dayjs(record.createdAt).fromNow()}
      </td>
    </tr>
  );
}
