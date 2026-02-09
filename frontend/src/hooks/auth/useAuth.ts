"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { LoginCredentials } from "@/type/user";
import { loginApi } from "@/api/user";
import { tokenAtom, userInfoAtom } from "@/store/auth";
import { toast } from "sonner";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setToken = useSetAtom(tokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    const res = await loginApi(credentials);

    if (res.code == 0 && res.data) {
      // 使用 tokenAtom 来管理 token，会自动同步到 localStorage
      setToken(res.data.token);
      // 映射后端返回的字段（id -> userId）
      setUserInfo({
        userId: res.data.id,
        loginId: res.data.loginId,
        nickname: res.data.nickname,
        role: res.data.role,
      });
      toast.success("登录成功");
      navigate({ to: res.data.role === 2 ? "/admin" : "/" });
    } else {
      toast.error(res.msg);
      setError(res.msg || "登录失败");
    }

    setIsLoading(false);
  };

  return {
    login: handleLogin,
    isLoading,
    error,
  };
}

//  上传图 》 得到oos图片url 》  提示词 + 图片 》 返回url 》 nestjs 上传oss 》 返回url
//  上传图 》 得到oos图片url 》  提示词 + 图片 》 返回url 》 nestjs 上传oss 》 返回url