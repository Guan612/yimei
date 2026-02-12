import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield } from "lucide-react";

/**
 * 用户信息卡片组件属性
 */
export interface UserProfileCardProps {
  /** 用户昵称 */
  nickname: string;
  /** 登录账号 */
  loginId: string;
  /** 用户ID */
  userId: number;
  /** 用户角色文本 */
  roleText: string;
}

/**
 * 用户信息卡片组件
 *
 * 展示用户的基本信息，包括昵称、账号、角色等
 */
export function UserProfileCard({
  nickname,
  loginId,
  userId,
  roleText,
}: UserProfileCardProps) {
  return (
    <Card className="card-elegant rounded-2xl p-8 opacity-0 animate-fade-up delay-1">
      <div className="flex items-start gap-6">
        {/* 头像 */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--rose-gold)] to-[var(--rose-gold-light)] flex items-center justify-center flex-shrink-0">
          <User className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>

        {/* 用户信息 */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl text-[var(--charcoal)] font-light mb-1">
              {nickname || "未设置昵称"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--rose-gold-pale)] text-[var(--rose-gold)] text-xs">
                <Shield className="w-3 h-3" />
                {roleText}
              </span>
            </div>
          </div>

          <Separator className="bg-[var(--warm-gray-light)]/30" />

          {/* 账户信息 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-(--warm-gray)" />
              <span className="text-(--warm-gray)">账号：</span>
              <span className="text-(--charcoal)">{loginId}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-(--warm-gray)" />
              <span className="text-(--warm-gray)">用户ID：</span>
              <span className="text-(--charcoal) font-mono">
                #{userId}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
