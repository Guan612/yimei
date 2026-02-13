/**
 * 统一的配色方案
 * 用于整个应用的图表、UI组件等
 */
export const CHART_COLORS = {
  // 主色调系列
  primary: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],

  // 渐变色系列
  gradient: ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981"],

  // 状态颜色
  status: {
    completed: "#10b981",
    processing: "#f59e0b",
    failed: "#ef4444",
  },

  // 卡片背景渐变色
  cardGradients: {
    blue: {
      from: "from-blue-50",
      to: "to-white",
      darkFrom: "dark:from-blue-950/20",
      darkTo: "dark:to-background",
      border: "border-blue-200",
      darkBorder: "dark:border-blue-900",
    },
    purple: {
      from: "from-purple-50",
      to: "to-white",
      darkFrom: "dark:from-purple-950/20",
      darkTo: "dark:to-background",
      border: "border-purple-200",
      darkBorder: "dark:border-purple-900",
    },
    green: {
      from: "from-green-50",
      to: "to-white",
      darkFrom: "dark:from-green-950/20",
      darkTo: "dark:to-background",
      border: "border-green-200",
      darkBorder: "dark:border-green-900",
    },
    cyan: {
      from: "from-cyan-50",
      to: "to-white",
      darkFrom: "dark:from-cyan-950/20",
      darkTo: "dark:to-background",
      border: "border-cyan-200",
      darkBorder: "dark:border-cyan-900",
    },
  },
};

/**
 * 图表主题配置
 */
export const CHART_THEME = {
  // 饼图样式
  pieStyle: {
    borderRadius: 10,
    borderColor: "#fff",
    borderWidth: 2,
  },

  // 柱状图样式
  barStyle: {
    borderRadius: [8, 8, 0, 0] as [number, number, number, number],
    barWidth: "60%",
  },

  // 折线图渐变
  lineGradient: {
    type: "linear" as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: "rgba(59, 130, 246, 0.5)" },
      { offset: 1, color: "rgba(59, 130, 246, 0.05)" },
    ],
  },

  // 折线样式
  lineStyle: {
    color: "#3b82f6",
    width: 3,
  },
};
