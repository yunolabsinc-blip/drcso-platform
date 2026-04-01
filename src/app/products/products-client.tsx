"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Heart, Search, ChevronLeft, ChevronRight, Pill, Plus, Pencil, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import DrugSearchModal from "@/components/drug-search-modal";
import type { User, Product, SaleStatus } from "@/lib/supabase/types";

interface ProductWithCompany extends Omit<Product, "company"> {
  company: { name: string } | null;
}

interface ProductsClientProps {
  profile: User;
  products: ProductWithCompany[];
  favoriteIds: string[];
  companies: { id: string; name: string }[];
}

const PAGE_SIZE = 20;

const saleStatusLabels: Record<SaleStatus, string> = {
  on_sale: "판매중",
  discontinued: "단종",
  pending: "보류",
};

const saleStatusColors: Record<SaleStatus, string> = {
  on_sale: "bg-green-100 text-green-800",
  discontinued: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

interface ProductForm {
  name: string;
  generic_name: string;
  category: string;
  department: string;
  base_price: string;
  commission_rate: string;
  description: string;
  sale_status: SaleStatus;
  is_tradeable: boolean;
  company_id: string;
}

const emptyForm: ProductForm = {
  name: "",
  generic_name: "",
  category: "",
  department: "",
  base_price: "0",
  commission_rate: "0",
  description: "",
  sale_status: "on_sale",
  is_tradeable: true,
  company_id: "",
};

export default function ProductsClient({ profile, products: initialProducts, favoriteIds: initialFavorites, companies }: ProductsClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [products, setProducts] = useState(initialProducts);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(initialFavorites));
  const [page, setPage] = useState(0);

  // 필터 상태
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showDrugSearch, setShowDrugSearch] = useState(false);

  // 제품 등록/수정 모달
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canManage = profile.role === "pharma" || profile.role === "admin";

  // 고유값 목록
  const companyNames = [...new Set(products.map((p) => p.company?.name).filter(Boolean))];
  const departments = [...new Set(products.map((p) => p.department).filter(Boolean))];
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  // 필터 적용
  const filtered = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.generic_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCompany && p.company?.name !== filterCompany) return false;
    if (filterDepartment && p.department !== filterDepartment) return false;
    if (filterStatus && p.sale_status !== filterStatus) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // 수수료 자동 계산
  const calcCommission = Math.round((parseInt(form.base_price) || 0) * (parseFloat(form.commission_rate) || 0) / 100);

  const toggleFavorite = async (productId: string) => {
    const isFav = favoriteIds.has(productId);
    const next = new Set(favoriteIds);
    if (isFav) {
      next.delete(productId);
      await supabase.from("favorites").delete().eq("product_id", productId).eq("user_id", profile.id);
    } else {
      next.add(productId);
      await supabase.from("favorites").insert({ user_id: profile.id, product_id: productId });
    }
    setFavoriteIds(next);
  };

  const openCreate = () => {
    setForm({ ...emptyForm, company_id: profile.company_id ?? "" });
    setEditingId(null);
    setError("");
    setShowModal(true);
  };

  const openEdit = (p: ProductWithCompany) => {
    setForm({
      name: p.name,
      generic_name: p.generic_name ?? "",
      category: p.category ?? "",
      department: p.department ?? "",
      base_price: String(p.base_price),
      commission_rate: String(p.commission_rate),
      description: p.description ?? "",
      sale_status: p.sale_status,
      is_tradeable: p.is_tradeable,
      company_id: p.company_id,
    });
    setEditingId(p.id);
    setError("");
    setShowModal(true);
  };

  const refreshProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, company:companies(name)")
      .order("created_at", { ascending: false });
    if (data) setProducts(data as unknown as ProductWithCompany[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("제품명을 입력해주세요."); return; }
    if (!form.company_id && profile.role === "admin") { setError("공급사를 선택해주세요."); return; }

    setLoading(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      generic_name: form.generic_name || null,
      category: form.category || null,
      department: form.department || null,
      base_price: parseInt(form.base_price) || 0,
      commission_rate: parseFloat(form.commission_rate) || 0,
      commission_amount: calcCommission,
      description: form.description || null,
      sale_status: form.sale_status,
      is_tradeable: form.is_tradeable,
      company_id: form.company_id || profile.company_id,
    };

    if (editingId) {
      const { error: err } = await supabase.from("products").update(payload).eq("id", editingId);
      if (err) { setError("수정 중 오류: " + err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.from("products").insert(payload);
      if (err) { setError("등록 중 오류: " + err.message); setLoading(false); return; }
    }

    setShowModal(false);
    setLoading(false);
    await refreshProducts();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await supabase.from("products").delete().eq("id", id);
    await refreshProducts();
  };

  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {canManage ? "제품 관리" : "전체 제품"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">총 {filtered.length}개 제품</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDrugSearch(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pill size={16} /> 의약품 검색
          </button>
          {canManage && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Plus size={16} /> 제품 등록
            </button>
          )}
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="제품명 / 성분 검색"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select value={filterCompany} onChange={(e) => { setFilterCompany(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none">
            <option value="">공급사 전체</option>
            {companyNames.map((c) => <option key={c} value={c!}>{c}</option>)}
          </select>
          <select value={filterDepartment} onChange={(e) => { setFilterDepartment(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none">
            <option value="">진료과목 전체</option>
            {departments.map((d) => <option key={d} value={d!}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none">
            <option value="">판매상태 전체</option>
            <option value="on_sale">판매중</option>
            <option value="discontinued">단종</option>
            <option value="pending">보류</option>
          </select>
          <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none">
            <option value="">약효분류 전체</option>
            {categories.map((c) => <option key={c} value={c!}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500 w-12">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">제품명</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">공급사</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">주성분</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">기준가</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">수수료율</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">수수료</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">판매상태</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">거래</th>
              {canManage ? (
                <th className="px-4 py-3 text-center font-medium text-gray-500 w-24">관리</th>
              ) : (
                <th className="px-4 py-3 text-center font-medium text-gray-500 w-12">관심</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  조건에 맞는 제품이 없습니다.
                </td>
              </tr>
            ) : (
              paginated.map((product, idx) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{page * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">{product.company?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{product.generic_name ?? "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{product.base_price.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-right text-gray-900">{product.commission_rate}%</td>
                  <td className="px-4 py-3 text-right text-primary font-medium">{product.commission_amount.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${saleStatusColors[product.sale_status]}`}>
                      {saleStatusLabels[product.sale_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${product.is_tradeable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                      {product.is_tradeable ? "가능" : "불가"}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(product)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  ) : (
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleFavorite(product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Heart size={18} className={favoriteIds.has(product.id) ? "fill-red-500 text-red-500" : ""} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 의약품 검색 모달 */}
      {showDrugSearch && (
        <DrugSearchModal onClose={() => setShowDrugSearch(false)} />
      )}

      {/* 제품 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-xl rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "제품 수정" : "제품 등록"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 공급사 선택 (admin만) */}
              {profile.role === "admin" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">공급사 *</label>
                  <select
                    required
                    value={form.company_id}
                    onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">공급사 선택</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 제품명 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제품명 *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="제품명 입력"
                />
              </div>

              {/* 성분명 / 약효분류 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">주성분 (성분명)</label>
                  <input
                    type="text"
                    value={form.generic_name}
                    onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="예: 아세트아미노펜"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">약효분류</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="예: 해열진통소염제"
                  />
                </div>
              </div>

              {/* 진료과목 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">진료과목</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="예: 내과, 정형외과"
                />
              </div>

              {/* 기준가 / 수수료율 / 수수료(자동) */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">가격 및 수수료</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">기준가 (원)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.base_price}
                      onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">수수료율 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={form.commission_rate}
                      onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">수수료 (자동계산)</label>
                    <div className="flex h-[42px] items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-primary">
                      {calcCommission.toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>

              {/* 판매상태 / 거래가능 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">판매상태</label>
                  <select
                    value={form.sale_status}
                    onChange={(e) => setForm({ ...form, sale_status: e.target.value as SaleStatus })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="on_sale">판매중</option>
                    <option value="pending">보류</option>
                    <option value="discontinued">단종</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">거래 가능 여부</label>
                  <div className="flex h-[42px] items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.is_tradeable}
                        onChange={() => setForm({ ...form, is_tradeable: true })}
                        className="accent-primary"
                      />
                      <span className="text-sm">가능</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!form.is_tradeable}
                        onChange={() => setForm({ ...form, is_tradeable: false })}
                        className="accent-primary"
                      />
                      <span className="text-sm">불가</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 설명 */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제품 설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="제품 설명 (선택)"
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
    </DashboardLayout>
  );
}
