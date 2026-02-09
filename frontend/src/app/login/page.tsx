'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from "@tanstack/react-router";
import { useAuth } from '@/hooks/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const loginSchema = z.object({
  loginId: z
    .string()
    .min(1, '请输入登录账号'),
  password: z
    .string()
    .min(1, '请输入密码')
    .min(6, '密码至少6位'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginId: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-primary-dark)] to-[#005a8c] relative">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-8">
              <span className="font-medium text-3xl font-semibold">A</span>
            </div>
            <h1 className="font-medium text-5xl font-light leading-tight mb-4">
              开启智能<br />医美新时代
            </h1>
            <p className="text-white/70 text-lg font-light max-w-md">
              融合 AI 视觉技术，为医美机构打造从咨询到转化的智能闭环
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: '✦', text: 'AI 驱动的术后效果模拟' },
              { icon: '✦', text: '品牌一致性海报生成' },
              { icon: '✦', text: '智能化运营数据分析' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-white/80">
                <span className="text-[var(--brand-primary-light)]">{item.icon}</span>
                <span className="font-light">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-hero p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] flex items-center justify-center shadow-lg">
              <span className="text-white font-medium text-lg font-semibold">A</span>
            </div>
            <span className="font-medium text-2xl tracking-tight text-[var(--neutral-800)]">
              Aestheti<span className="text-[var(--brand-primary)]">Core</span>
            </span>
          </div>

          <div className="mb-10">
            <h2 className="font-medium text-3xl text-[var(--neutral-800)] mb-2">欢迎回来</h2>
            <p className="text-[var(--neutral-500)] font-light">登录您的账户以继续</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="loginId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--neutral-600)]">登录账号</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="请输入登录账号"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[var(--neutral-600)]">密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    登录中...
                  </>
                ) : '登录'}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--neutral-500)]">
              忘记密码？请联系管理员
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--neutral-200)]">
            <Link to="/" className="flex items-center justify-center gap-2 text-sm text-[var(--neutral-500)] hover:text-[var(--brand-primary)] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
