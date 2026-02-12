import { Card } from "@/components/ui/card";
import { LogOut } from "lucide-react";

/**
 * 账户操作卡片组件属性
 */
export interface AccountActionsCardProps {
  /** 退出登录回调函数 */
  onLogout: () => void;
}

/**
 * 账户操作卡片组件
 *
 * 提供账户相关的操作按钮，如退出登录
 */
export function AccountActionsCard({ onLogout }: AccountActionsCardProps) {
  return (
    <Card className="card-elegant rounded-2xl p-8 opacity-0 animate-fade-up delay-3">
      <h3 className="text-lg text-[var(--charcoal)] font-light mb-6">
        账户操作
      </h3>

      <div className="space-y-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-6 py-4 rounded-xl border border-[var(--warm-gray-light)]/30 hover:border-[var(--rose-gold)] hover:bg-[var(--rose-gold-pale)] transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-[var(--warm-gray)] group-hover:text-[var(--rose-gold)] transition-colors" />
            <div className="text-left">
              <div className="text-sm text-[var(--charcoal)] group-hover:text-[var(--rose-gold)] transition-colors">
                退出登录
              </div>
              <div className="text-xs text-[var(--warm-gray)]">
                退出当前账户
              </div>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-[var(--warm-gray-light)] group-hover:text-[var(--rose-gold)] group-hover:translate-x-1 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </button>
      </div>
    </Card>
  );
}
