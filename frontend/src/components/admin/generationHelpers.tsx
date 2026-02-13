// 状态配置映射
export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  completed: {
    label: "完成",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  },
  pending: {
    label: "待处理",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
  },
  generating: {
    label: "生成中",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  },
  failed: {
    label: "失败",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  },
};

// Provider配置映射
export const PROVIDER_CONFIG: Record<string, { className: string }> = {
  stability: {
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
  },
  openai: {
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  },
  aliyun: {
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
  },
  gemini: {
    className: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
  },
};

// 获取状态标签组件
export function getStatusBadge(status: string) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

// 获取Provider标签组件
export function getProviderBadge(provider: string) {
  const config = PROVIDER_CONFIG[provider.toLowerCase()] || {
    className: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {provider}
    </span>
  );
}
