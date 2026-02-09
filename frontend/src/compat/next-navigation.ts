import { useMemo } from "react";
import {
  useNavigate,
  useRouterState,
  redirect as tanstackRedirect,
} from "@tanstack/react-router";

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => navigate({ to: href }),
      replace: (href: string) => navigate({ to: href, replace: true }),
      back: () => window.history.back(),
      forward: () => window.history.forward(),
    }),
    [navigate],
  );
}

export function usePathname() {
  return useRouterState({ select: (s) => s.location.pathname });
}

export function useSearchParams() {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function redirect(to: string): never {
  throw tanstackRedirect({ to });
}
