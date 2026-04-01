"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Plus, Search, Pencil, Trash2, X, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import HospitalSearchModal from "@/components/hospital-search-modal";
import type { User, Customer, CustomerType } from "@/lib/supabase/types";

interface CustomersClientProps {
  profile: User;
  customers: Customer[];
}

const typeLabels: Record<CustomerType, string> = {
  hospital: "병원",
  pharmacy: "약국",
  other: "기타",
};

const typeColors: Record<CustomerType, string> = {
  hospital: "bg-blue-100 text-blue-800",
  pharmacy: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

interface FormState {
  name: string;
  type: CustomerType;
  address: string;
  phone: string;
  contact_person: string;
  notes: string;
}

const emptyForm: FormState = {
  name: "",
  type: "hospital",
  address: "",
  phone: "",
  contact_person: "",
  notes: "",
};

export default function CustomersClient({ profile, customers: initial }: CustomersClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [customers, setCustomers] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = customers.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && c.type !== filterType) return false;
    return true;
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setForm({
      name: c.name,
      type: c.type,
      address: c.address ?? "",
      phone: c.phone ?? "",
      contact_person: c.contact_person ?? "",
      notes: c.notes ?? "",
    });
    setEditingId(c.id);
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("거래처명을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      type: form.type,
      address: form.address || null,
      phone: form.phone || null,
      contact_person: form.contact_person || null,
      notes: form.notes || null,
    };

    if (editingId) {
      const { error: err } = await supabase
        .from("customers")
        .update(payload)
        .eq("id", editingId);
      if (err) { setError("수정 중 오류가 발생했습니다."); setLoading(false); return; }
    } else {
      const { error: err } = await supabase
        .from("customers")
        .insert({ ...payload, user_id: profile.id });
      if (err) { setError("등록 중 오류가 발생했습니다."); setLoading(false); return; }
    }

    setShowModal(false);
    setLoading(false);
    router.refresh();

    // 로컬 리프레시
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCustomers(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("customers").delete().eq("id", id);
    setCustomers(customers.filter((c) => c.id !== id));
  };

  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">거래처 관리</h1>
          <p className="mt-1 text-sm text-gray-500">총 {filtered.length}개 거래처</p>
        </div>
        {profile.role === "cso" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Building2 size={16} /> 병원/약국 검색
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Plus size={16} /> 직접 등록
            </button>
          </div>
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
            placeholder="거래처명 검색"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">유형 전체</option>
          <option value="hospital">병원</option>
          <option value="pharmacy">약국</option>
          <option value="other">기타</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">거래처명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">유형</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">주소</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">연락처</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">담당자</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">등록일</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500 w-24">관리</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  등록된 거래처가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[c.type]}`}>
                      {typeLabels[c.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.address ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.contact_person ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "거래처 수정" : "거래처 등록"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">거래처명 *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="거래처명 입력"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">유형</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["hospital", "pharmacy", "other"] as CustomerType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                        form.type === t
                          ? "border-primary bg-primary-light text-primary"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {typeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">주소</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="주소 입력"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">연락처</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="02-000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">담당자</label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="담당자명"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">비고</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="메모 입력"
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
                  {loading ? "처리중..." : editingId ? "수정" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 병원/약국 검색 모달 */}
      {showSearch && (
        <HospitalSearchModal
          onClose={() => setShowSearch(false)}
          onSelect={(result) => {
            setForm({
              name: result.name,
              type: result.customerType,
              address: result.address,
              phone: result.phone,
              contact_person: "",
              notes: "",
            });
            setEditingId(null);
            setError("");
            setShowSearch(false);
            setShowModal(true);
          }}
        />
      )}
    </DashboardLayout>
  );
}
