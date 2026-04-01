"use client";

import { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Heart, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User, Product, SaleStatus } from "@/lib/supabase/types";

interface ProductWithCompany extends Omit<Product, "company"> {
  company: { name: string } | null;
}

interface ProductsClientProps {
  profile: User;
  products: ProductWithCompany[];
  favoriteIds: string[];
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

export default function ProductsClient({ profile, products, favoriteIds: initialFavorites }: ProductsClientProps) {
  const supabase = createClient();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(initialFavorites));
  const [page, setPage] = useState(0);

  // 필터 상태
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // 고유값 목록
  const companies = [...new Set(products.map((p) => p.company?.name).filter(Boolean))];
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

  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">전체 제품</h1>
        <p className="mt-1 text-sm text-gray-500">
          총 {filtered.length}개 제품
        </p>
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
          <select
            value={filterCompany}
            onChange={(e) => { setFilterCompany(e.target.value); setPage(0); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">공급사 전체</option>
            {companies.map((c) => <option key={c} value={c!}>{c}</option>)}
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => { setFilterDepartment(e.target.value); setPage(0); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">진료과목 전체</option>
            {departments.map((d) => <option key={d} value={d!}>{d}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">판매상태 전체</option>
            <option value="on_sale">판매중</option>
            <option value="discontinued">단종</option>
            <option value="pending">보류</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
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
              <th className="px-4 py-3 text-center font-medium text-gray-500 w-12">관심</th>
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
                  <td className="px-4 py-3 text-right text-gray-900">
                    {product.base_price.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{product.commission_rate}%</td>
                  <td className="px-4 py-3 text-right text-primary font-medium">
                    {product.commission_amount.toLocaleString()}원
                  </td>
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
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Heart
                        size={18}
                        className={favoriteIds.has(product.id) ? "fill-red-500 text-red-500" : ""}
                      />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
