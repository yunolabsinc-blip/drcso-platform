"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function FindEmailClient() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPhone = (value: string) => {
    const nums = value.replace(/\D/g, "").slice(0, 11);
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const { data, error: queryError } = await supabase
        .from("users")
        .select("email")
        .eq("name", name.trim())
        .eq("phone", phone.trim())
        .single();

      if (queryError || !data) {
        setError("일치하는 계정을 찾을 수 없습니다. 이름과 연락처를 확인해주세요.");
      } else {
        // 이메일 일부 마스킹
        const email = data.email;
        const [local, domain] = email.split("@");
        const masked = local.length <= 3
          ? local[0] + "***"
          : local.slice(0, 3) + "***";
        setResult(`${masked}@${domain}`);
      }
    } catch {
      setError("조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo />
          <p className="mt-2 text-sm text-gray-600">이메일 찾기</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          {result ? (
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mb-1 text-sm text-gray-600">등록된 이메일</p>
              <p className="mb-6 text-lg font-bold text-gray-900">{result}</p>
              <Link
                href="/login"
                className="inline-block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-white hover:bg-primary-hover"
              >
                로그인하기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-4 text-sm text-gray-500">
                가입 시 등록한 이름과 연락처를 입력하세요.
              </p>

              <div className="mb-4">
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">이름</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="홍길동"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">연락처</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="010-0000-0000"
                />
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "조회 중..." : "이메일 찾기"}
              </button>
            </form>
          )}

          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <Link href="/login" className="text-gray-500 hover:text-gray-700">로그인</Link>
            <span className="text-gray-300">|</span>
            <Link href="/reset-password" className="text-gray-500 hover:text-gray-700">비밀번호 찾기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
