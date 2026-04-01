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
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
