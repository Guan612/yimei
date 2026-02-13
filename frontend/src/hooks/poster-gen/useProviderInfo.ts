import { useAtom } from "jotai";
import { selectedProviderIdAtom, providersAtom } from "@/store/imageGen";

/**
 * Provider 信息 Hook
 * 提取 provider 相关的逻辑判断
 */
export function useProviderInfo() {
  const [selectedProviderId] = useAtom(selectedProviderIdAtom);
  const [providers] = useAtom(providersAtom);

  // 获取当前选中的 provider
  const selectedProvider = selectedProviderId
    ? providers.find((p) => p.id === selectedProviderId)
    : null;

  // 判断 provider 类型
  const isGeminiProvider = selectedProvider?.provider === "gemini";
  const isOpenAIProvider = selectedProvider?.provider === "openai";
  const isGPTImageModel =
    isOpenAIProvider && selectedProvider?.modelId?.startsWith("gpt-image");
  const isDallE3 = isOpenAIProvider && selectedProvider?.modelId === "dall-e-3";

  return {
    selectedProviderId,
    selectedProvider,
    isGeminiProvider,
    isOpenAIProvider,
    isGPTImageModel,
    isDallE3,
  };
}
