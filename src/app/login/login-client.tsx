"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

const SAVED_EMAIL_KEY = "drcso_saved_email";
const AUTO_LOGIN_KEY = "drcso_auto_login";

export default function LoginClient() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // 저장된 이메일 불러오기 + 자동 로그인 체크
  useEffect(() => {
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    const savedAutoLogin = localStorage.getItem(AUTO_LOGIN_KEY);

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
    if (savedAutoLogin === "true") {
      setAutoLogin(true);
    }

    // 자동 로그인: 세션이 있으면 바로 대시보드로
    if (savedAutoLogin === "true") {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          router.push("/dashboard");
        } else {
          setCheckingSession(false);
        }
      });
    } else {
      setCheckingSession(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      // 이메일 기억하기
      if (rememberEmail) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }

      // 자동 로그인
      if (autoLogin) {
        localStorage.setItem(AUTO_LOGIN_KEY, "true");
      } else {
        localStorage.removeItem(AUTO_LOGIN_KEY);
      }

      router.push("/dashboard");
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">로그인 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo />
          <p className="mt-2 text-sm text-gray-600">로그인</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              이메일
            </label>
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

          <div className="mb-4">
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="비밀번호 입력"
            />
          </div>

          {/* 체크박스 */}
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <span className="text-sm text-gray-600">이메일 기억하기</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              <span className="text-sm text-gray-600">자동 로그인</span>
            </label>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

          {/* 이메일 찾기 / 비밀번호 찾기 */}
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <Link href="/find-email" className="text-gray-500 hover:text-gray-700">
              이메일 찾기
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/reset-password" className="text-gray-500 hover:text-gray-700">
              비밀번호 찾기
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
