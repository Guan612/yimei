import { useNavigate } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { tokenAtom, userInfoAtom } from "@/store/auth";

/**
 * 用户角色文本映射
 */
const ROLE_TEXT_MAP: Record<number, string> = {
  0: "普通用户",
  1: "高级用户",
  2: "管理员",
};

/**
 * 用户个人资料Hook返回类型
 */
export interface UseUserProfileReturn {
  /** 用户信息 */
  userInfo: {
    userId: number;
    loginId: string;
    nickname: string;
    role: number;
  };
  /** 用户角色文本 */
  roleText: string;
  /** 退出登录函数 */
  handleLogout: () => void;
}

/**
 * 用户个人资料Hook
 *
 * 封装个人中心页面的用户信息获取和退出登录逻辑
 *
 * @example
 * ```tsx
 * const { userInfo, roleText, handleLogout } = useUserProfile();
 * ```
 */
export function useUserProfile(): UseUserProfileReturn {
  const navigate = useNavigate();
  const userInfo = useAtomValue(userInfoAtom);
  const setToken = useSetAtom(tokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);

  const getRoleText = (role: number): string => {
    return ROLE_TEXT_MAP[role] || "未知角色";
  };

  const handleLogout = () => {
    setToken(null);
    setUserInfo({ userId: 0, loginId: "", nickname: "", role: 0 });
    navigate({ to: "/" });
  };

  return {
    userInfo,
    roleText: getRoleText(userInfo.role),
    handleLogout,
  };
}
