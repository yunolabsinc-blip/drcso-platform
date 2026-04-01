"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Camera,
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/types";

interface ParsedItem {
  hospital_name: string;
  product_name: string;
  product_id: string | null;
  generic_name: string | null;
  quantity: number;
  amount: number;
  commission_rate: number;
  commission: number;
  matched: boolean;
}

interface Product {
  id: string;
  name: string;
  base_price: number;
  commission_rate: number;
  commission_amount: number;
}

interface EdiScanClientProps {
  profile: User;
  products: Product[];
  customers: { id: string; name: string }[];
}

export default function EdiScanClient({
  profile,
  products,
  customers,
}: EdiScanClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "analyzing" | "result">(
    "upload"
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 이미지 선택 처리
  const handleImage = async (file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setStep("analyzing");

      // base64 추출
      const base64 = dataUrl.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      try {
        const res = await fetch("/api/edi-parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "분석 실패");
          setStep("upload");
          return;
        }

        setItems(data.items || []);
        setStep("result");
      } catch {
        setError("서버 연결에 실패했습니다.");
        setStep("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  // 항목 수정
  const updateItem = (index: number, field: string, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      // 제품 변경 시 수수료 재계산
      if (field === "product_id") {
        const p = products.find((pp) => pp.id === value);
        if (p) {
          item.product_name = p.name;
          item.commission_rate = p.commission_rate;
          item.commission = Math.round((item.amount * p.commission_rate) / 100);
          item.matched = true;
        }
      }
      // 금액 변경 시 수수료 재계산
      if (field === "amount") {
        item.commission = Math.round(
          ((value as number) * item.commission_rate) / 100
        );
      }

      next[index] = item;
      return next;
    });
  };

  // 항목 삭제
  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // 저장
  const handleSave = async () => {
    if (items.length === 0) return;
    setSaving(true);
    setError("");

    const today = new Date().toISOString().split("T")[0];
    const records = items
      .filter((item) => item.product_id)
      .map((item) => ({
        user_id: profile.id,
        product_id: item.product_id,
        customer_id: null as string | null,
        edi_date: today,
        quantity: item.quantity,
        amount: item.amount,
        commission: item.commission,
      }));

    if (records.length === 0) {
      setError("저장할 수 있는 항목이 없습니다. 제품을 매칭해주세요.");
      setSaving(false);
      return;
    }

    const { error: err } = await supabase.from("edi_records").insert(records);

    if (err) {
      setError("저장 중 오류가 발생했습니다.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
  };

  // 합계
  const totalAmount = items.reduce((s, i) => s + i.amount, 0);
  const totalCommission = items.reduce((s, i) => s + i.commission, 0);

  return (
    <DashboardLayout role={profile.role} userName={profile.name}>
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push("/edi")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            EDI 자동 스캔
          </h1>
          <p className="text-sm text-gray-500">
            서류를 촬영하면 자동으로 정산금액을 계산합니다
          </p>
        </div>
      </div>

      {/* STEP 1: 업로드 */}
      {step === "upload" && (
        <div className="mx-auto max-w-lg">
          {/* 미리보기 */}
          {preview && (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200">
              <img
                src={preview}
                alt="EDI 서류"
                className="w-full object-contain"
                style={{ maxHeight: 300 }}
              />
            </div>
          )}

          {/* 업로드 영역 */}
          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
              <ImagePlus className="text-primary" size={28} />
            </div>
            <p className="mb-1 text-base font-semibold text-gray-900">
              EDI 서류 사진 업로드
            </p>
            <p className="mb-6 text-sm text-gray-500">
              처방전, 매출명세서, EDI 내역서를 촬영하거나 선택해주세요
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => cameraRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover active:scale-[0.98]"
              >
                <Camera size={18} /> 카메라 촬영
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
              >
                <ImagePlus size={18} /> 갤러리에서 선택
              </button>
            </div>

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* 안내 */}
          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              촬영 팁
            </p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>- 서류 전체가 화면에 들어오도록 촬영해주세요</li>
              <li>- 밝은 곳에서 그림자 없이 촬영하면 인식률이 높아집니다</li>
              <li>- 병원명, 제품명, 수량, 금액이 선명하게 보여야 합니다</li>
            </ul>
          </div>
        </div>
      )}

      {/* STEP 2: 분석 중 */}
      {step === "analyzing" && (
        <div className="mx-auto max-w-lg">
          {preview && (
            <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 opacity-60">
              <img
                src={preview}
                alt="분석 중"
                className="w-full object-contain"
                style={{ maxHeight: 250 }}
              />
            </div>
          )}
          <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-10">
            <Loader2
              size={40}
              className="animate-spin text-primary"
            />
            <p className="mt-4 text-base font-semibold text-gray-900">
              서류 분석 중...
            </p>
            <p className="mt-1 text-sm text-gray-500">
              AI가 EDI 내역을 읽고 있습니다
            </p>
          </div>
        </div>
      )}

      {/* STEP 3: 결과 */}
      {step === "result" && (
        <div className="mx-auto max-w-2xl">
          {/* 저장 완료 */}
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">
              <CheckCircle2 size={18} />
              실적이 저장되었습니다!
              <button
                onClick={() => router.push("/edi")}
                className="ml-auto text-green-800 underline"
              >
                실적 목록 보기
              </button>
            </div>
          )}

          {/* 미리보기 축소 */}
          {preview && (
            <div className="mb-4 overflow-hidden rounded-xl border border-gray-200">
              <img
                src={preview}
                alt="EDI 서류"
                className="w-full object-contain"
                style={{ maxHeight: 160 }}
              />
            </div>
          )}

          {/* 합계 카드 */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">총 처방금액</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {totalAmount.toLocaleString()}
                <span className="ml-0.5 text-sm font-normal text-gray-500">
                  원
                </span>
              </p>
            </div>
            <div className="rounded-xl border-2 border-primary bg-primary-light p-4">
              <p className="text-xs text-primary">예상 정산금액</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {totalCommission.toLocaleString()}
                <span className="ml-0.5 text-sm font-normal">원</span>
              </p>
            </div>
          </div>

          {/* 추출 항목 리스트 */}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      {item.hospital_name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* 제품 선택 */}
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    제품
                    {!item.matched && (
                      <span className="ml-1 text-red-500">
                        (매칭 필요)
                      </span>
                    )}
                  </label>
                  <select
                    value={item.product_id || ""}
                    onChange={(e) =>
                      updateItem(idx, "product_id", e.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
                      item.matched
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50"
                    }`}
                  >
                    <option value="">제품 선택</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.commission_rate}%)
                      </option>
                    ))}
                  </select>
                  {!item.matched && item.product_name && (
                    <p className="mt-1 text-xs text-gray-400">
                      AI 인식: {item.product_name}
                    </p>
                  )}
                </div>

                {/* 수량 / 금액 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      수량
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "quantity",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500">
                      처방금액 (원)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "amount",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* 정산 정보 */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">
                    수수료율 {item.commission_rate}%
                  </span>
                  <span className="text-sm font-bold text-primary">
                    정산 {item.commission.toLocaleString()}원
                  </span>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
              <AlertCircle
                size={32}
                className="mx-auto mb-3 text-gray-400"
              />
              <p className="text-sm text-gray-500">
                인식된 항목이 없습니다. 서류를 다시 촬영해주세요.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* 하단 버튼 */}
          {!saved && (
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setStep("upload");
                  setItems([]);
                  setPreview(null);
                  setError("");
                  if (cameraRef.current) cameraRef.current.value = "";
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw size={16} /> 다시 스캔
              </button>
              <button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "저장 중..." : "실적 저장"}
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
