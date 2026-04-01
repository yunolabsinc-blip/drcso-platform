"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupClient() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        // 회사 정보 저장
        let companyId: string | null = null;
        if (companyName.trim()) {
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .insert({
              name: companyName.trim(),
              business_number: businessNumber.trim() || null,
              type: "supplier",
            })
            .select("id")
            .single();

          if (companyError) {
            setError("회사 정보 저장 중 오류가 발생했습니다.");
            return;
          }
          companyId = companyData.id;
        }

        // 사용자 프로필 저장
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          email,
          name,
          phone: phone || null,
          role: "cso",
          company_id: companyId,
        });

        if (profileError) {
          setError("프로필 저장 중 오류가 발생했습니다.");
          return;
        }

        router.push("/dashboard");
      }
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold">
              Dr
            </div>
            <span className="text-2xl font-bold text-gray-900">DrCSO</span>
          </Link>
          <p className="mt-2 text-sm text-gray-600">CSO 딜러 회원가입</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-8">
          {/* 이름 */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              이름 *
            </label>
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

          {/* 이메일 */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              이메일 *
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

          {/* 연락처 */}
          <div className="mb-4">
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
              연락처 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="010-0000-0000"
            />
          </div>

          {/* 회사 정보 */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-700">회사 정보</p>
            <div className="space-y-3">
              <div>
                <label htmlFor="companyName" className="mb-1 block text-xs font-medium text-gray-500">
                  회사명 (상호)
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                  placeholder="회사명 입력"
                />
              </div>
              <div>
                <label htmlFor="businessNumber" className="mb-1 block text-xs font-medium text-gray-500">
                  사업자등록번호
                </label>
                <input
                  id="businessNumber"
                  type="text"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                  placeholder="000-00-00000"
                />
              </div>
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="mb-4">
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              비밀번호 *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="6자 이상"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div className="mb-6">
            <label htmlFor="passwordConfirm" className="mb-1 block text-sm font-medium text-gray-700">
              비밀번호 확인 *
            </label>
            <input
              id="passwordConfirm"
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="비밀번호 재입력"
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
            {loading ? "가입 중..." : "회원가입"}
          </button>

          <p className="mt-4 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
