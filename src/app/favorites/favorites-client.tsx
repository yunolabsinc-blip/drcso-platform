"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Heart, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User, SaleStatus } from "@/lib/supabase/types";

interface FavoriteRow {
  id: string;
  product_id: string;
  product: {
    name: string;
    generic_name: string | null;
    base_price: number;
    commission_rate: number;
    commission_amount: number;
    sale_status: SaleStatus;
    is_tradeable: boolean;
    company: { name: string } | null;
  } | null;
}

interface FavoritesClientProps {
  profile: User;
  favorites: FavoriteRow[];
}

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

export default function FavoritesClient({ profile, favorites: initial }: FavoritesClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [favorites, setFavorites] = useState(initial);
  const [search, setSearch] = useState("");

  const filtered = favorites.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.product?.name.toLowerCase().includes(q) ||
      f.product?.generic_name?.toLowerCase().includes(q) ||
      f.product?.company?.name.toLowerCase().includes(q)
    );
  });

  const removeFavorite = async (favoriteId: string, productId: string) => {
    await supabase.from("favorites").delete().eq("user_id", profile.id).eq("product_id", productId);
    setFavorites(favorites.filter((f) => f.id !== favoriteId));
  };

  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">관심 제품</h1>
        <p className="mt-1 text-sm text-gray-500">찜한 제품 {filtered.length}개</p>
      </div>

      {/* 검색 */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제품명 / 성분 / 공급사 검색"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <Heart className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-500">관심 제품이 없습니다.</p>
          <p className="mt-1 text-sm text-gray-400">전체 제품 페이지에서 하트를 눌러 추가하세요.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">제품명</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">공급사</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">주성분</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">기준가</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">수수료율</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">수수료</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">판매상태</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">거래</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 w-12">삭제</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => {
                const p = f.product;
                if (!p) return null;
                return (
                  <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.company?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{p.generic_name ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{p.base_price.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right text-gray-900">{p.commission_rate}%</td>
                    <td className="px-4 py-3 text-right text-primary font-medium">{p.commission_amount.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${saleStatusColors[p.sale_status]}`}>
                        {saleStatusLabels[p.sale_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${p.is_tradeable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                        {p.is_tradeable ? "가능" : "불가"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeFavorite(f.id, f.product_id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="관심 해제"
                      >
                        <Heart size={18} className="fill-red-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
