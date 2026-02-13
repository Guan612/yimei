"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Wrench,
  Users,
  BarChart3,
  Boxes,
  ArrowLeft,
  Sparkles,
  History,
} from "lucide-react";

const navItems = [
  {
    title: "Provider配置",
    href: "/admin/providers",
    icon: Wrench,
  },
  {
    title: "用户管理",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "生成统计",
    href: "/admin/stats",
    icon: BarChart3,
  },
  {
    title: "生成记录",
    href: "/admin/generations",
    icon: History,
  },
  {
    title: "模型管理",
    href: "/admin/models",
    icon: Boxes,
  },
  {
    title: "医美术语配置",
    href: "/admin/medical-aesthetics",
    icon: Sparkles,
  },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="w-64 border-r bg-muted/10 h-full p-6 flex flex-col overflow-hidden">
      <div className="mb-8 shrink-0">
        <h2 className="text-2xl font-bold">管理后台</h2>
        <p className="text-sm text-muted-foreground mt-1">系统配置与管理</p>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-8 border-t shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          返回前台
        </Link>
      </div>
    </div>
  );
}
