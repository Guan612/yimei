"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAtomValue, useSetAtom } from "jotai";
import { tokenAtom, userInfoAtom } from "@/store/auth";
import { useRouteGuard } from "@/hooks/auth/useRouteGuard";

export default function DashboardPage() {
  useRouteGuard();

  const router = useRouter();
  const token = useAtomValue(tokenAtom);
  const userInfo = useAtomValue(userInfoAtom);
  const setToken = useSetAtom(tokenAtom);
  const setUserInfo = useSetAtom(userInfoAtom);

  const handleLogout = () => {
    setToken(null);
    setUserInfo({ userId: 0, loginId: "", nickname: "", role: 0 });
    router.push("/");
  };

  const services = [
    {
      name: "FaceSim",
      subtitle: "AI 美学模拟器",
      description:
        "上传照片，AI 智能分析面部特征，自由绘制或框选区域，实时预览祛痘、祛斑、瘦脸等术后效果",
      href: "/facesim",
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
      ),
    },
    {
      name: "BrandGuard",
      subtitle: "海报生成引擎",
      description:
        "一键生成符合品牌 VI 的营销海报，内置违禁词检测，AI 智能排版，合规无忧",
      href: "/poster-gen",
      icon: (
        <svg
          className="w-10 h-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--cream)] relative overflow-hidden">
      {/* 装饰背景 */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,var(--rose-gold-pale)_0%,transparent_60%)] opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,var(--sage-light)_0%,transparent_60%)] opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-[var(--warm-gray-light)]/20 bg-white/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rose-gold)] to-[var(--rose-gold-light)] flex items-center justify-center">
              <span className="text-white text-lg font-light">A</span>
            </div>
            <span className="text-xl tracking-[0.15em] text-[var(--charcoal)] font-light">
              AESTHETI<span className="text-[var(--rose-gold)]">CORE</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {token && (
              <>
                <span className="text-sm text-[var(--warm-gray)]">
                  {userInfo.nickname || userInfo.loginId}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-[var(--warm-gray)] hover:text-[var(--rose-gold)] transition-colors cursor-pointer"
                >
                  退出登录
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-8 py-16">
        {/* Welcome */}
        <div className="mb-12">
          <p className="text-[var(--rose-gold)] text-sm tracking-[0.3em] uppercase mb-2">
            Welcome Back
          </p>
          <h1 className="text-3xl font-light text-[var(--charcoal)]">
            你好，
            <span className="text-gradient">
              {userInfo.nickname || userInfo.loginId || "用户"}
            </span>
          </h1>
          <p className="mt-2 text-[var(--warm-gray)]">
            选择一个功能开始使用
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service) => (
            <Link
              key={service.name}
              href={service.href}
              className="group card-elegant rounded-2xl p-10 bg-white"
            >
              <div className="flex flex-col gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[var(--rose-gold-pale)] text-[var(--rose-gold)] flex items-center justify-center group-hover:bg-[var(--rose-gold)] group-hover:text-white transition-all duration-500">
                  {service.icon}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl text-[var(--charcoal)] group-hover:text-[var(--rose-gold)] transition-colors">
                      {service.name}
                    </h2>
                    <svg
                      className="w-5 h-5 text-[var(--warm-gray-light)] group-hover:text-[var(--rose-gold)] group-hover:translate-x-2 transition-all duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-[var(--rose-gold-light)] tracking-wider">
                    {service.subtitle}
                  </p>
                  <p className="text-[var(--warm-gray)] leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
