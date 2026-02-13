import type { EChartsOption } from "echarts";
import { CHART_COLORS, CHART_THEME } from "@/constants/colors";

/**
 * Provider 分布饼图配置
 */
export function getProviderChartOption(
  data: Array<{ provider: string; count: number; cost: number }>
): EChartsOption {
  return {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)<br/>成本: ${d}",
    },
    legend: {
      bottom: "0%",
      left: "center",
    },
    series: [
      {
        name: "Provider",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: CHART_THEME.pieStyle,
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: "bold",
          },
        },
        labelLine: {
          show: false,
        },
        data: data.map((item, index) => ({
          value: item.count,
          name: item.provider,
          itemStyle: {
            color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length],
          },
        })),
      },
    ],
  };
}

/**
 * 状态分布环形图配置
 */
export function getStatusChartOption(
  data: Array<{ status: string; count: number }>
): EChartsOption {
  return {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      bottom: "0%",
      left: "center",
    },
    series: [
      {
        name: "状态",
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: CHART_THEME.pieStyle,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: "bold",
          },
        },
        data: data.map((item) => ({
          value: item.count,
          name: item.status,
          itemStyle: {
            color:
              CHART_COLORS.status[item.status as keyof typeof CHART_COLORS.status] ||
              CHART_COLORS.primary[0],
          },
        })),
      },
    ],
  };
}

/**
 * 类型分布柱状图配置
 */
export function getTypeChartOption(
  data: Array<{ type: string; count: number }>
): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: data.map((item) => item.type),
      axisLabel: {
        rotate: 30,
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "数量",
        type: "bar",
        data: data.map((item, index) => ({
          value: item.count,
          itemStyle: {
            color: CHART_COLORS.gradient[index % CHART_COLORS.gradient.length],
          },
        })),
        barWidth: CHART_THEME.barStyle.barWidth,
        itemStyle: {
          borderRadius: CHART_THEME.barStyle.borderRadius,
        },
      },
    ],
  };
}

/**
 * 趋势折线图配置
 */
export function getTrendChartOption(
  data: Array<{ date: string; count: number }>
): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((item) => item.date),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "生成次数",
        type: "line",
        smooth: true,
        data: data.map((item) => item.count),
        areaStyle: {
          color: CHART_THEME.lineGradient,
        },
        lineStyle: CHART_THEME.lineStyle,
        itemStyle: {
          color: CHART_THEME.lineStyle.color,
        },
      },
    ],
  };
}

/**
 * 聊天上下文柱状图配置
 */
export function getContextChartOption(
  data: Array<{ context: string; count: number }>
): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
    },
    yAxis: {
      type: "category",
      data: data.map((item) => item.context),
    },
    series: [
      {
        name: "数量",
        type: "bar",
        data: data.map((item, index) => ({
          value: item.count,
          itemStyle: {
            color: CHART_COLORS.primary[index % CHART_COLORS.primary.length],
          },
        })),
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
        },
      },
    ],
  };
}
