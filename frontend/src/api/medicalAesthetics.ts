import {
  creatMedicalAesthetics,
  medicalAestheticsRespons,
  updateMedicalAesthetics,
} from "@/type/medicalAesthetics";
import type { PaginatedData, PaginationQuery } from "@/type/common";
import { api } from ".";

// 查询参数类型扩展
export interface MedicalAestheticsQuery extends PaginationQuery {
  category?: string;
}

// 修复：根据实际返回数据，API 返回的是数组而不是分页数据
export const medicalAestheticsListApi = (params?: MedicalAestheticsQuery) => {
  return api.get<medicalAestheticsRespons[]>(`/api/medical-aesthetics`, {
    params,
  });
};

export const createMedicalAestheticsApi = (data: creatMedicalAesthetics) => {
  return api.post<medicalAestheticsRespons>("/api/medical-aesthetics", data);
};

export const updateMedicalAestheticsApi = (
  id: number,
  data: updateMedicalAesthetics,
) => {
  return api.patch<medicalAestheticsRespons>(
    `/api/medical-aesthetics/${id}`,
    data,
  );
};

export const deleteMedicalAestheticsApi = (id: string) => {
  return api.delete<medicalAestheticsRespons>(`/api/medical-aesthetics/${id}`);
};

// 用户个人提示词管理（分页）
export const getMyPromptsApi = (params?: PaginationQuery) => {
  return api.get<PaginatedData<medicalAestheticsRespons>>(
    "/api/medical-aesthetics/my",
    { params }
  );
};

export const createMyPromptApi = (data: creatMedicalAesthetics) => {
  return api.post<medicalAestheticsRespons>("/api/medical-aesthetics/my", data);
};

export const updateMyPromptApi = (
  id: number,
  data: updateMedicalAesthetics,
) => {
  return api.patch<medicalAestheticsRespons>(
    `/api/medical-aesthetics/my/${id}`,
    data,
  );
};

export const deleteMyPromptApi = (id: number) => {
  return api.delete<medicalAestheticsRespons>(
    `/api/medical-aesthetics/my/${id}`,
  );
};
