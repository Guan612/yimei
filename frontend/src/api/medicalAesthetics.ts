import {
  creatMedicalAesthetics,
  medicalAestheticsRespons,
  updateMedicalAesthetics,
} from "@/type/medicalAesthetics";
import { api } from ".";

export const medicalAestheticsListApi = (category?: string | undefined) => {
  return api.get<medicalAestheticsRespons[]>(`/api/medical-aesthetics`, {
    params: category ? { category } : undefined,
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

// 用户个人提示词管理
export const getMyPromptsApi = () => {
  return api.get<medicalAestheticsRespons[]>("/api/medical-aesthetics/my");
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
