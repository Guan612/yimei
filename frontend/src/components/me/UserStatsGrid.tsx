import { Card } from "@/components/ui/card";

/**
 * 统计项数据
 */
export interface StatItem {
  /** 标签 */
  label: string;
  /** 数值 */
  value: string;
}

/**
 * 用户统计网格组件属性
 */
export interface UserStatsGridProps {
  /** 统计项列表 */
  stats: StatItem[];
}

/**
 * 用户统计网格组件
 *
 * 以卡片网格形式展示用户的统计信息
 */
export function UserStatsGrid({ stats }: UserStatsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-6 opacity-0 animate-fade-up delay-2">
      {stats.map((stat, index) => (
        <Card key={index} className="card-elegant rounded-2xl p-6 text-center">
          <div className="text-2xl text-[var(--rose-gold)] font-light mb-2">
            {stat.value}
          </div>
          <div className="text-sm text-[var(--warm-gray)]">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}
