"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Search, UserCheck, UserX } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/types";

interface MembersClientProps {
  profile: User;
  members: User[];
}

export default function MembersClient({ profile, members: initial }: MembersClientProps) {
  const supabase = createClient();
  const [members, setMembers] = useState(initial);
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const toggleActive = async (memberId: string, currentActive: boolean) => {
    await supabase.from("users").update({ is_active: !currentActive }).eq("id", memberId);
    setMembers(members.map((m) =>
      m.id === memberId ? { ...m, is_active: !currentActive } : m
    ));
  };

  const activeCount = members.filter((m) => m.is_active).length;

  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">딜러 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          총 {members.length}명 (활성 {activeCount}명)
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 / 이메일 검색"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">이름</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">이메일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">연락처</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">가입일</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 w-24">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  등록된 딜러가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.email}</td>
                  <td className="px-4 py-3 text-gray-600">{m.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      m.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {m.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(m.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(m.id, m.is_active)}
                      className={`rounded p-1.5 transition-colors ${
                        m.is_active
                          ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                          : "text-green-400 hover:bg-green-50 hover:text-green-600"
                      }`}
                      title={m.is_active ? "비활성화" : "활성화"}
                    >
                      {m.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
