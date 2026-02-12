"use client";

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAtomValue, useSetAtom } from "jotai";
import { tokenAtom, userInfoAtom } from "@/store/auth";

const navLinks = [
  { href: "/facesim", label: "FaceSim" },
  { href: "/poster-gen", label: "海报生成" },
];

export function AppHeader() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const token = useAtomValue(tokenAtom);
  const userInfo = useAtomValue(userInfoAtom);
  const setToken = useSetAtom(tokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);

  const handleLogout = () => {
    setToken(null);
    setUserInfo({ userId: 0, loginId: "", nickname: "", role: 0 });
    navigate({ to: "/" });
  };

  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--rose-gold)] to-[var(--rose-gold-light)] flex items-center justify-center">
            <span className="text-white text-sm font-light">A</span>
          </div>
          <span className="text-lg tracking-[0.1em] text-[var(--charcoal)] font-light">
            AESTHETI<span className="text-[var(--rose-gold)]">CORE</span>
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "text-[var(--rose-gold)] bg-[var(--rose-gold-pale)]"
                      : "text-[var(--warm-gray)] hover:text-[var(--charcoal)] hover:bg-black/[0.03]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="w-px h-5 bg-[var(--warm-gray-light)]" />

          {token ? (
            <div className="flex items-center gap-4">
              {userInfo.role === 2 && (
                <Link
                  to="/admin"
                  className="text-sm text-[var(--warm-gray)] hover:text-[var(--rose-gold)] transition-colors"
                >
                  管理后台
                </Link>
              )}
              <Link
                to="/me"
                className=" text-warm-gray px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-black/[0.03]"
              >
                {userInfo.nickname || userInfo.loginId}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-[var(--warm-gray)] hover:text-[var(--rose-gold)] transition-colors cursor-pointer"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm text-[var(--warm-gray)] hover:text-[var(--rose-gold)] transition-colors"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
