"use client";

import { useState } from "react";
import { Search, X, Building2, Pill, Loader2 } from "lucide-react";

type SearchType = "hospital" | "pharmacy";

interface SearchResult {
  name: string;
  address: string;
  phone: string;
  type?: string;
}

interface HospitalSearchModalProps {
  onSelect: (result: SearchResult & { customerType: "hospital" | "pharmacy" }) => void;
  onClose: () => void;
}

export default function HospitalSearchModal({ onSelect, onClose }: HospitalSearchModalProps) {
  const [searchType, setSearchType] = useState<SearchType>("hospital");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const endpoint = searchType === "hospital" ? "/api/search/hospital" : "/api/search/pharmacy";
      const res = await fetch(`${endpoint}?name=${encodeURIComponent(query)}&size=30`);
      const data = await res.json();
      setResults(data.items ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">병원/약국 검색</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* 검색 영역 */}
        <div className="border-b border-gray-200 px-6 py-4">
          {/* 타입 토글 */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => { setSearchType("hospital"); setResults([]); setSearched(false); }}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                searchType === "hospital"
                  ? "border-primary bg-primary-light text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Building2 size={16} /> 병원 검색
            </button>
            <button
              onClick={() => { setSearchType("pharmacy"); setResults([]); setSearched(false); }}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                searchType === "pharmacy"
                  ? "border-primary bg-primary-light text-primary"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Pill size={16} /> 약국 검색
            </button>
          </div>

          {/* 검색 입력 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchType === "hospital" ? "병원명 입력" : "약국명 입력"}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "검색"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            건강보험심사평가원 공공데이터 기반 실시간 검색
          </p>
        </div>

        {/* 결과 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              {searched ? "검색 결과가 없습니다." : `${searchType === "hospital" ? "병원" : "약국"}명을 입력하고 검색하세요.`}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelect({
                    ...r,
                    customerType: searchType === "hospital" ? "hospital" : "pharmacy",
                  })}
                  className="w-full rounded-lg border border-gray-200 p-4 text-left transition-colors hover:border-primary hover:bg-primary-light"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{r.address}</p>
                      <div className="mt-1 flex gap-3 text-xs text-gray-400">
                        {r.phone && <span>Tel: {r.phone}</span>}
                        {r.type && <span>{r.type}</span>}
                      </div>
                    </div>
                    <span className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      searchType === "hospital" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                    }`}>
                      {searchType === "hospital" ? "병원" : "약국"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
