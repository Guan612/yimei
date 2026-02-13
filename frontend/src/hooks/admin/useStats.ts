import { useEffect, useState } from "react";
import { getStatsApi } from "@/api/stats";
import type { StatsData } from "@/type/stats";
import { toast } from "sonner";

/**
 * 统计数据管理 Hook
 */
export function useStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getStatsApi();
      setStats(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "加载统计数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    loading,
    loadStats,
  };
}
