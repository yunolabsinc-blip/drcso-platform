"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./logo";
import {
  LayoutDashboard,
  Package,
  Building2,
  ArrowLeftRight,
  BarChart3,
  LogOut,
  Heart,
  Menu,
  X,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/lib/supabase/types";

interface SidebarProps {
  role: UserRole;
  userName: string;
  onLogout: () => void;
}

const menuItems: Record<UserRole, { href: string; label: string; icon: React.ReactNode }[]> = {
  cso: [
    { href: "/dashboard", label: "대시보드", icon: <LayoutDashboard size={20} /> },
    { href: "/products", label: "전체 제품", icon: <Package size={20} /> },
    { href: "/favorites", label: "관심 제품", icon: <Heart size={20} /> },
    { href: "/customers", label: "거래처 관리", icon: <Building2 size={20} /> },
    { href: "/transactions", label: "거래 요청", icon: <ArrowLeftRight size={20} /> },
    { href: "/edi", label: "실적 관리", icon: <BarChart3 size={20} /> },
  ],
  admin: [
    { href: "/dashboard", label: "대시보드", icon: <LayoutDashboard size={20} /> },
    { href: "/products", label: "제품 관리", icon: <Package size={20} /> },
    { href: "/customers", label: "거래처 관리", icon: <Building2 size={20} /> },
    { href: "/transactions", label: "거래 현황", icon: <ArrowLeftRight size={20} /> },
    { href: "/edi", label: "실적 관리", icon: <BarChart3 size={20} /> },
    { href: "/members", label: "딜러 관리", icon: <Users size={20} /> },
  ],
};

const roleLabels: Record<UserRole, string> = {
  cso: "CSO 딜러",
  admin: "관리자",
};

export default function Sidebar({ role, userName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = menuItems[role];

  return (
    <>
      <button
        className="fixed top-3 left-3 z-50 rounded-lg bg-primary p-2 text-white shadow-md md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-gray-200 bg-white transition-transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center border-b border-gray-200 px-5">
          <Logo size="sm" />
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{roleLabels[role]}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
