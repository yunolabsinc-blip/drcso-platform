"use client";

import { useRouter } from "next/navigation";
import Sidebar from "./sidebar";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
}

export default function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} userName={userName} onLogout={handleLogout} />
      <main className="flex-1 md:ml-64">
        {/* 상단 헤더 */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-end border-b border-gray-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{userName}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              로그아웃
            </button>
          </div>
        </header>
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
