import { useState } from "react";

export function useGenerateFormState() {
  // 基础提示词
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");

  // 提示词注入配置
  const [promptInjectPosition, setPromptInjectPosition] = useState<
    "prepend" | "append"
  >("prepend");

  // 高级选项
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<
    "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  >("1:1");
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7);

  return {
    // 提示词
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,

    // 提示词注入位置
    promptInjectPosition,
    setPromptInjectPosition,

    // 高级选项
    showAdvanced,
    setShowAdvanced,
    aspectRatio,
    setAspectRatio,
    steps,
    setSteps,
    cfgScale,
    setCfgScale,
  };
}
