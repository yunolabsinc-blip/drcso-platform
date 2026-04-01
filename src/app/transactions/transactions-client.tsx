"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Plus, Search, X, Check, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User, TransactionStatus } from "@/lib/supabase/types";

interface TransactionRow {
  id: string;
  user_id: string;
  status: TransactionStatus;
  quantity: number;
  notes: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    base_price: number;
    commission_rate: number;
    commission_amount: number;
    company: { name: string } | null;
  } | null;
  customer: {
    id: string;
    name: string;
    type: string;
  } | null;
}

interface TransactionsClientProps {
  profile: User;
  transactions: TransactionRow[];
  products: { id: string; name: string; company: { name: string } | null }[];
  customers: { id: string; name: string; type: string }[];
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

export default function TransactionsClient({
  profile,
  transactions: initial,
  products,
  customers,
}: TransactionsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [transactions, setTransactions] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 새 거래 요청 폼
  const [formProductId, setFormProductId] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formQuantity, setFormQuantity] = useState("1");
  const [formNotes, setFormNotes] = useState("");

  const filtered = transactions.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.product?.name.toLowerCase().includes(q) &&
        !t.customer?.name.toLowerCase().includes(q)
      ) return false;
    }
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const refreshData = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*, product:products(id, name, base_price, commission_rate, commission_amount, company:companies(name)), customer:customers(id, name, type)")
      .order("created_at", { ascending: false });
    if (data) setTransactions(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId || !formCustomerId) {
      setError("제품과 거래처를 선택해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: err } = await supabase.from("transactions").insert({
      user_id: profile.id,
      product_id: formProductId,
      customer_id: formCustomerId,
      quantity: parseInt(formQuantity) || 1,
      notes: formNotes || null,
    });

    if (err) {
      setError("등록 중 오류가 발생했습니다.");
      setLoading(false);
      return;
    }

    setShowModal(false);
    setLoading(false);
    setFormProductId("");
    setFormCustomerId("");
    setFormQuantity("1");
    setFormNotes("");
    await refreshData();
    router.refresh();
  };

  const updateStatus = async (id: string, status: TransactionStatus) => {
    await supabase
      .from("transactions")
      .update({ status, reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    await refreshData();
  };

  const isAdmin = profile.role === "admin";
  const isCso = profile.role === "cso";

  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래 요청</h1>
          <p className="mt-1 text-sm text-gray-500">총 {filtered.length}건</p>
        </div>
        {isCso && (
          <button
            onClick={() => { setError(""); setShowModal(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            <Plus size={16} /> 거래 요청
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제품명 / 거래처명 검색"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">상태 전체</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">제품명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">공급사</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">거래처</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">수량</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">기준가</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">수수료</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">요청일</th>
              {isAdmin && (
                <th className="px-4 py-3 text-center font-medium text-gray-500 w-28">처리</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center text-gray-500">
                  거래 요청이 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.product?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{t.product?.company?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{t.customer?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{t.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {(t.product?.base_price ?? 0).toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-right text-primary font-medium">
                    {(t.product?.commission_amount ?? 0).toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[t.status]}`}>
                      {statusLabels[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(t.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      {(t.status === "pending" || t.status === "reviewing") && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateStatus(t.id, "approved")}
                            className="rounded p-1.5 text-green-600 hover:bg-green-50"
                            title="승인"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => updateStatus(t.id, "rejected")}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            title="반려"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 거래 요청 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">거래 요청</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제품 *</label>
                <select
                  required
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">제품 선택</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.company ? `(${p.company.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">거래처 *</label>
                <select
                  required
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">거래처 선택</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">수량</label>
                <input
                  type="number"
                  min="1"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">메모</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="요청사항 입력"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {loading ? "처리중..." : "요청하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
