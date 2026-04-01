"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { Package, ArrowLeftRight, Building2, TrendingUp } from "lucide-react";
import type { User, TransactionStatus } from "@/lib/supabase/types";

interface DashboardClientProps {
  profile: User;
  stats: {
    products: number;
    transactions: number;
    customers: number;
  };
  recentTransactions: Array<{
    id: string;
    status: TransactionStatus;
    quantity: number;
    created_at: string;
    product: { name: string } | null;
    customer: { name: string } | null;
  }>;
}

const statusLabels: Record<TransactionStatus, string> = {
  pending: "대기",
  reviewing: "확인중",
  approved: "승인",
  rejected: "반려",
  completed: "완료",
};

const statusColors: Record<TransactionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-gray-100 text-gray-800",
};

export default function DashboardClient({ profile, stats, recentTransactions }: DashboardClientProps) {
  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {profile.name}님
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          오늘의 현황을 확인하세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="text-primary" size={24} />}
          label="전체 제품"
          value={stats.products}
        />
        <StatCard
          icon={<ArrowLeftRight className="text-blue-500" size={24} />}
          label="거래 요청"
          value={stats.transactions}
        />
        <StatCard
          icon={<Building2 className="text-green-500" size={24} />}
          label="거래처"
          value={stats.customers}
        />
        <StatCard
          icon={<TrendingUp className="text-purple-500" size={24} />}
          label="이번 달 실적"
          value={0}
          suffix="건"
        />
      </div>

      {/* 최근 거래 요청 */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">최근 거래 요청</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            아직 거래 요청이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-500">제품명</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">거래처</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">수량</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">상태</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">요청일</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="px-6 py-3 text-gray-900">{tx.product?.name ?? "-"}</td>
                    <td className="px-6 py-3 text-gray-600">{tx.customer?.name ?? "-"}</td>
                    <td className="px-6 py-3 text-gray-600">{tx.quantity}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[tx.status]}`}>
                        {statusLabels[tx.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value.toLocaleString()}
        {suffix && <span className="ml-1 text-base font-normal text-gray-500">{suffix}</span>}
      </p>
    </div>
  );
}
