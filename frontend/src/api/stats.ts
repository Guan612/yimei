import { api } from "./index";
import type { StatsData, GetStatsQuery } from "@/type/stats";

/**
 * 统计API
 */

/**
 * 获取统计数据
 */
export const getStatsApi = (query?: GetStatsQuery) => {
  const params = new URLSearchParams();
  if (query?.startDate) {
    params.append("startDate", query.startDate);
  }
  if (query?.endDate) {
    params.append("endDate", query.endDate);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/stats?${queryString}` : "/api/stats";

  return api.get<StatsData>(url);
};
