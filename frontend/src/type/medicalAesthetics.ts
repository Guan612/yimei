import { Label } from "@radix-ui/react-label";
import z from "zod";

export interface medicalAestheticsRespons {
  id: number;
  category: string;
  label: string;
  prompt: string;
  description?: string;
}

export interface MedicalAestheticsTerm {
  id: number;
  category: string;
  label: string;
  prompt: string;
  description?: string;
}

export const MEDICAL_AESTHETICS_CATEGORIES = [
  { id: "skin", label: "皮肤改善" },
  { id: "face", label: "面部轮廓" },
  { id: "eyes", label: "眼部" },
  { id: "nose", label: "鼻部" },
  { id: "lips", label: "唇部" },
  { id: "poster", label: "海报提示词" },
  { id: "other", label: "其他" },
] as const;

const CreateMedicalAesthetiShema = z.object({
  category: z
    .enum(["skin", "face", "eyes", "nose", "lips", "poster", "other"])
    .describe("选择添加提示词部位"),
  label: z.string().min(1, { message: "需要填写选项" }),
  prompt: z.string().min(1, { message: "需要填写提示词" }),
  description: z.string().min(1, { message: "需要填写描述" }).optional(),
});

const UpdateMedicalAesthetiShema = CreateMedicalAesthetiShema.partial();

export type creatMedicalAesthetics = z.infer<typeof CreateMedicalAesthetiShema>;

export type updateMedicalAesthetics = z.infer<
  typeof UpdateMedicalAesthetiShema
>;
