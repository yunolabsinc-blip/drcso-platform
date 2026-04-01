"use client";

import { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface DrugResult {
  itemName: string;
  entpName: string;
  itemSeq: string;
  efcyQesitm: string;
  useMethodQesitm: string;
  atpnQesitm: string;
  seQesitm: string;
  depositMethodQesitm: string;
  itemImage: string | null;
}

interface DrugSearchModalProps {
  onClose: () => void;
}

export default function DrugSearchModal({ onClose }: DrugSearchModalProps) {
  const [query, setQuery] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [results, setResults] = useState<DrugResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugResult | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const handleSearch = async (pageNum = 1) => {
    if (!query.trim() && !companyQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setPage(pageNum);

    try {
      const params = new URLSearchParams({ page: String(pageNum), size: "20" });
      if (query.trim()) params.set("name", query.trim());
      if (companyQuery.trim()) params.set("company", companyQuery.trim());

      const res = await fetch(`/api/search/drug?${params.toString()}`);
      const data = await res.json();
      setResults(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">의약품 검색</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* 검색 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="의약품명 입력"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <input
              type="text"
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="업체명 (선택)"
              className="w-40 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => handleSearch(1)}
              disabled={loading || (!query.trim() && !companyQuery.trim())}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "검색"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            식약처 의약품 허가정보 기반 검색 {searched && `| 총 ${total.toLocaleString()}건`}
          </p>
        </div>

        {/* 결과 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {selectedDrug ? (
            <DrugDetail drug={selectedDrug} onBack={() => setSelectedDrug(null)} />
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              {searched ? "검색 결과가 없습니다." : "의약품명을 입력하고 검색하세요."}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {results.map((drug, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDrug(drug)}
                    className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-primary hover:bg-primary-light"
                  >
                    <div className="flex items-start gap-3">
                      {drug.itemImage && (
                        <img
                          src={drug.itemImage}
                          alt={drug.itemName}
                          className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{drug.itemName}</p>
                        <p className="mt-0.5 text-sm text-gray-500">{drug.entpName}</p>
                        {drug.efcyQesitm && (
                          <p className="mt-1 text-xs text-gray-400 line-clamp-2">{drug.efcyQesitm}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* 페이지네이션 */}
              {total > 20 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleSearch(page - 1)}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    이전
                  </button>
                  <span className="text-sm text-gray-500">
                    {page} / {Math.ceil(total / 20)}
                  </span>
                  <button
                    onClick={() => handleSearch(page + 1)}
                    disabled={page >= Math.ceil(total / 20)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DrugDetail({ drug, onBack }: { drug: DrugResult; onBack: () => void }) {
  const sections = [
    { label: "효능·효과", content: drug.efcyQesitm },
    { label: "용법·용량", content: drug.useMethodQesitm },
    { label: "주의사항", content: drug.atpnQesitm },
    { label: "부작용", content: drug.seQesitm },
    { label: "보관법", content: drug.depositMethodQesitm },
  ].filter((s) => s.content);

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm text-primary hover:underline">
        ← 목록으로
      </button>

      <div className="flex gap-4">
        {drug.itemImage && (
          <img
            src={drug.itemImage}
            alt={drug.itemName}
            className="h-24 w-24 rounded-xl border border-gray-200 object-cover"
          />
        )}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{drug.itemName}</h3>
          <p className="mt-1 text-sm text-gray-500">{drug.entpName}</p>
          <p className="mt-0.5 text-xs text-gray-400">품목기준코드: {drug.itemSeq}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sections.map((s) => (
          <div key={s.label} className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">{s.label}</h4>
            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
