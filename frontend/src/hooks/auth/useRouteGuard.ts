"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
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
      router.replace(loginUrl);
    }
  }, [token, router, pathname, isHydrated]);

  // 返回是否已认证
  return !!token;
}
