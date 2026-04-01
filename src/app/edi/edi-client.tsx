"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Plus, X, BarChart3, DollarSign, Package, Calculator } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/types";

interface EdiRow {
  id: string;
  edi_date: string;
  quantity: number;
  amount: number;
  commission: number;
  product: { name: string; commission_rate: number } | null;
  customer: { name: string } | null;
}

interface EdiClientProps {
  profile: User;
  ediRecords: EdiRow[];
  products: { id: string; name: string; base_price: number; commission_rate: number; commission_amount: number }[];
  customers: { id: string; name: string }[];
  monthlySummary: Record<string, { amount: number; commission: number; count: number }>;
}

export default function EdiClient({
  profile,
  ediRecords: initial,
  products,
  customers,
  monthlySummary,
}: EdiClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [records, setRecords] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 등록 폼
  const [formProductId, setFormProductId] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formQuantity, setFormQuantity] = useState("1");
  const [formAmount, setFormAmount] = useState("0");

  // 수수료 계산기
  const [calcProductId, setCalcProductId] = useState("");
  const [calcQuantity, setCalcQuantity] = useState("1");

  const calcProduct = products.find((p) => p.id === calcProductId);
  const calcCommission = calcProduct
    ? calcProduct.commission_amount * (parseInt(calcQuantity) || 0)
    : 0;

  // 전체 합계
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const totalCommission = records.reduce((sum, r) => sum + r.commission, 0);
  const totalCount = records.reduce((sum, r) => sum + r.quantity, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId) { setError("제품을 선택해주세요."); return; }
    setLoading(true);
    setError("");

    const product = products.find((p) => p.id === formProductId);
    const qty = parseInt(formQuantity) || 1;
    const amount = parseInt(formAmount) || 0;
    const commission = product ? Math.round(amount * product.commission_rate / 100) : 0;

    const { error: err } = await supabase.from("edi_records").insert({
      user_id: profile.id,
      product_id: formProductId,
      customer_id: formCustomerId || null,
      edi_date: formDate,
      quantity: qty,
      amount,
      commission,
    });

    if (err) { setError("등록 중 오류가 발생했습니다."); setLoading(false); return; }

    setShowModal(false);
    setLoading(false);
    router.refresh();

    const { data } = await supabase
      .from("edi_records")
      .select("*, product:products(name, commission_rate), customer:customers(name)")
      .order("edi_date", { ascending: false });
    if (data) setRecords(data);
  };

  const sortedMonths = Object.entries(monthlySummary).sort(([a], [b]) => b.localeCompare(a));

  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">실적 관리</h1>
          <p className="mt-1 text-sm text-gray-500">EDI 실적 데이터</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCalc(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Calculator size={16} /> 수수료 계산기
          </button>
          {profile.role === "cso" && (
            <button
              onClick={() => { setError(""); setShowModal(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Plus size={16} /> 실적 등록
            </button>
          )}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Package className="text-blue-500" size={20} />
          </div>
          <p className="text-sm text-gray-500">총 실적 건수</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalCount.toLocaleString()}<span className="ml-1 text-base font-normal text-gray-500">건</span></p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
            <DollarSign className="text-green-500" size={20} />
          </div>
          <p className="text-sm text-gray-500">총 매출액</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalAmount.toLocaleString()}<span className="ml-1 text-base font-normal text-gray-500">원</span></p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
            <BarChart3 className="text-primary" size={20} />
          </div>
          <p className="text-sm text-gray-500">총 수수료</p>
          <p className="mt-1 text-2xl font-bold text-primary">{totalCommission.toLocaleString()}<span className="ml-1 text-base font-normal text-gray-500">원</span></p>
        </div>
      </div>

      {/* 월별 요약 */}
      {sortedMonths.length > 0 && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">월별 실적 요약</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-500">월</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">건수</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">매출액</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500">수수료</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.map(([month, data]) => (
                  <tr key={month} className="border-b border-gray-100">
                    <td className="px-6 py-3 font-medium text-gray-900">{month}</td>
                    <td className="px-6 py-3 text-right text-gray-600">{data.count.toLocaleString()}건</td>
                    <td className="px-6 py-3 text-right text-gray-900">{data.amount.toLocaleString()}원</td>
                    <td className="px-6 py-3 text-right text-primary font-medium">{data.commission.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 실적 상세 테이블 */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">실적 상세</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">일자</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">제품명</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">거래처</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">수량</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">금액</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">수수료율</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">수수료</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    등록된 실적이 없습니다.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{r.edi_date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.product?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.customer?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{r.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{r.amount.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.product?.commission_rate ?? 0}%</td>
                    <td className="px-4 py-3 text-right text-primary font-medium">{r.commission.toLocaleString()}원</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 실적 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">실적 등록</h2>
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
                    <option key={p.id} value={p.id}>{p.name} (수수료율: {p.commission_rate}%)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">거래처</label>
                <select
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">거래처 선택 (선택사항)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">실적일자</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">금액 (원)</label>
                  <input
                    type="number"
                    min="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
                <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                  {loading ? "처리중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 수수료 계산기 모달 */}
      {showCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">수수료 계산기</h2>
              <button onClick={() => setShowCalc(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">제품</label>
                <select
                  value={calcProductId}
                  onChange={(e) => setCalcProductId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">제품 선택</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {calcProduct && (
                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">기준가</span>
                    <span className="font-medium">{calcProduct.base_price.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">수수료율</span>
                    <span className="font-medium">{calcProduct.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">건당 수수료</span>
                    <span className="font-medium text-primary">{calcProduct.commission_amount.toLocaleString()}원</span>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">수량</label>
                <input
                  type="number"
                  min="1"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {calcProduct && (
                <div className="rounded-xl border-2 border-primary bg-primary-light p-4 text-center">
                  <p className="text-sm text-gray-600">예상 총 수수료</p>
                  <p className="mt-1 text-3xl font-bold text-primary">
                    {calcCommission.toLocaleString()}원
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowCalc(false)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
