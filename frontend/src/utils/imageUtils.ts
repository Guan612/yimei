/**
 * 图片相关工具函数
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8010";

/**
 * 构建完整的图片URL
 * @param fileKey - 文件的key路径，如 "generated/2026/2/generated/1770705056049.png"
 * @returns 完整的图片URL
 */
export function buildImageUrl(fileKey: string): string {
  if (!fileKey) return "";

  // 如果已经是完整URL，直接返回
  if (fileKey.startsWith("http://") || fileKey.startsWith("https://")) {
    return fileKey;
  }

  // 拼接API_BASE_URL和文件路径
  const baseUrl = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  const path = fileKey.startsWith("/") ? fileKey : `/${fileKey}`;

  return `${baseUrl}${path}`;
}

/**
 * 下载图片
 * @param imageUrl - 图片URL
 * @param filename - 保存的文件名
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
