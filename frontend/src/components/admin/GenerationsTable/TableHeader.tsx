import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TableHeaderProps {
  total: number;
  onRefresh: () => void;
  loading: boolean;
}

export function TableHeader({ total, onRefresh, loading }: TableHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="text-sm text-muted-foreground">共 {total} 条记录</div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        刷新
      </Button>
    </div>
  );
}
