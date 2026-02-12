import { createFileRoute } from "@tanstack/react-router";
import { useUserProfile } from "@/hooks/auth/useUserProfile";
import {
  UserProfileCard,
  UserStatsGrid,
  AccountActionsCard,
  MyPrompts,
  type StatItem,
} from "@/components/me";

/**
 * 用户统计数据
 */
const USER_STATS: StatItem[] = [
  { label: "账户状态", value: "正常" },
  { label: "注册时间", value: "2026-01" },
  { label: "使用次数", value: "—" },
];

/**
 * 个人中心页面组件
 */
function MePage() {
  const { userInfo, roleText, handleLogout } = useUserProfile();

  return (
    <div className="min-h-screen bg-[var(--cream)] noise-overlay">
      {/* 装饰背景 */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,var(--rose-gold-pale)_0%,transparent_60%)] opacity-40 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* 页面标题 */}
        <div className="mb-12 space-y-3 opacity-0 animate-fade-up">
          <h1 className="text-3xl font-light text-[var(--charcoal)]">
            个人中心
          </h1>
          <div className="line-elegant"></div>
          <p className="text-[var(--warm-gray)] text-sm">
            管理你的个人信息和账户设置
          </p>
        </div>

        {/* 主要内容 */}
        <div className="space-y-6">
          {/* 个人信息卡片 */}
          <UserProfileCard
            nickname={userInfo.nickname}
            loginId={userInfo.loginId}
            userId={userInfo.userId}
            roleText={roleText}
          />

          {/* 统计信息 */}
          <UserStatsGrid stats={USER_STATS} />

          {/* 我的提示词 */}
          <MyPrompts />

          {/* 操作区域 */}
          <AccountActionsCard onLogout={handleLogout} />

          {/* 提示信息 */}
          <div className="text-center text-sm text-[var(--warm-gray)] opacity-0 animate-fade-up delay-4">
            <p>如需修改个人信息，请联系管理员</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/me")({
  component: MePage,
});
