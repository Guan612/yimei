import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { medicalAestheticsListApi } from "@/api/medicalAesthetics";
import type { MedicalAestheticsTerm } from "@/type/medicalAesthetics";

export function usePromptTerms() {
  const [terms, setTerms] = useState<MedicalAestheticsTerm[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [promptInjectIds, setPromptInjectIds] = useState<number[]>([]);
  const [injectSearch, setInjectSearch] = useState("");
  const [filteredTerms, setFilteredTerms] = useState<MedicalAestheticsTerm[]>([]);

  // 加载提示词库
  useEffect(() => {
    const loadTerms = async () => {
      try {
        setLoadingTerms(true);
        const res = await medicalAestheticsListApi({ category: "poster" });
        if (res.code !== 0) {
          toast.error(res.msg || "加载提示词库失败");
          setTerms([]);
          return;
        }
        setTerms(res.data || []);
      } catch (e: any) {
        toast.error("加载提示词库失败", {
          description: e?.message,
        });
      } finally {
        setLoadingTerms(false);
      }
    };

    loadTerms();
  }, []);

  // 过滤提示词
  useEffect(() => {
    const search = injectSearch.trim().toLowerCase();
    const filtered = (terms || [])
      .filter((t) => {
        if (!search) return true;
        const hay = `${t.label ?? ""} ${t.prompt ?? ""} ${t.description ?? ""}`
          .toLowerCase()
          .trim();
        return hay.includes(search);
      })
      .sort((a, b) => {
        if (a.category !== b.category)
          return a.category.localeCompare(b.category);
        return (a.label || "").localeCompare(b.label || "");
      });
    setFilteredTerms(filtered);
  }, [terms, injectSearch]);

  // 切换单个提示词的选择状态
  const toggleInjectId = useCallback((id: number, checked: boolean) => {
    setPromptInjectIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  }, []);

  // 清空所有选择
  const clearSelection = useCallback(() => {
    setPromptInjectIds([]);
  }, []);

  // 全选当前筛选结果
  const selectFiltered = useCallback(() => {
    const ids = filteredTerms.map((t) => t.id);
    setPromptInjectIds((prev) => Array.from(new Set([...prev, ...ids])));
  }, [filteredTerms]);

  return {
    // 数据
    terms,
    filteredTerms,
    loadingTerms,
    promptInjectIds,

    // 过滤条件
    injectSearch,
    setInjectSearch,

    // 操作方法
    toggleInjectId,
    clearSelection,
    selectFiltered,
  };
}
