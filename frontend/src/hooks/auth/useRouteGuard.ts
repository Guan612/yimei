"use client";

import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { tokenAtom } from "@/store/auth";

/**
 * 路由守卫 Hook
 * 用于保护需要登录才能访问的页面
 *
 * @example
 * ```tsx
 * export default function ProtectedPage() {
 *   useRouteGuard();
 *   return <div>Protected Content</div>;
 * }
 * ```
 */
export function useRouteGuard() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const token = useAtomValue(tokenAtom);
  const [isHydrated, setIsHydrated] = useState(false);

  // 等待客户端 hydration 完成
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // 只在 hydration 完成后才进行鉴权检查
    if (!isHydrated) return;

    // 如果没有 token，重定向到登录页
    if (!token) {
      // 保存当前路径，登录后可以跳转回来
      const loginUrl = `/login?from=${encodeURIComponent(pathname)}`;
      navigate({ to: loginUrl, replace: true });
    }
  }, [token, navigate, pathname, isHydrated]);

  // 返回是否已认证
  return !!token;
}
