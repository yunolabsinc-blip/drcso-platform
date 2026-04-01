"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordClient() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) {
        setError("비밀번호 재설정 메일 발송에 실패했습니다.");
      } else {
        setSent(true);
      }
    } catch {
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo />
          <p className="mt-2 text-sm text-gray-600">비밀번호 찾기</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="mb-2 text-lg font-bold text-gray-900">메일을 확인하세요</p>
              <p className="mb-6 text-sm text-gray-500">
                <span className="font-medium text-gray-700">{email}</span>으로<br />
                비밀번호 재설정 링크를 보냈습니다.
              </p>
              <Link
                href="/login"
                className="inline-block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="mb-4 text-sm text-gray-500">
                가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
              </p>

              <div className="mb-6">
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">이메일</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="example@email.com"
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
                {loading ? "발송 중..." : "재설정 메일 보내기"}
              </button>
            </form>
          )}

          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <Link href="/login" className="text-gray-500 hover:text-gray-700">로그인</Link>
            <span className="text-gray-300">|</span>
            <Link href="/find-email" className="text-gray-500 hover:text-gray-700">이메일 찾기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
