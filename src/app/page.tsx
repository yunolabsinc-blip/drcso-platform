import Link from "next/link";
import Logo from "@/components/logo";
import { ArrowRight, Package, Building2, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="flex flex-1 items-center bg-gradient-to-br from-white to-orange-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
              CSO 딜러와 제약사를
              <br />
              <span className="text-primary">스마트하게 연결</span>합니다
            </h1>
            <p className="mt-6 text-lg text-gray-600">
              제품 검색부터 거래 요청, 실적 관리까지.
              Dr.CSO 플랫폼으로 효율적인 CSO 비즈니스를 시작하세요.
            </p>
            <div className="mt-8 flex gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary-hover"
              >
                무료로 시작하기 <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 */}
      <section className="border-t border-gray-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900">주요 기능</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Package className="text-primary" size={28} />}
              title="제품 관리"
              description="진료과목별, 약효분류별로 제품을 검색하고 관심 제품을 관리하세요."
            />
            <FeatureCard
              icon={<Building2 className="text-primary" size={28} />}
              title="거래처 관리"
              description="병원, 약국 등 거래처를 등록하고 거래 요청 현황을 실시간으로 확인하세요."
            />
            <FeatureCard
              icon={<BarChart3 className="text-primary" size={28} />}
              title="실적 관리"
              description="EDI 데이터 기반 실적 현황과 수수료를 한눈에 파악하세요."
            />
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          &copy; 2026 Dr.CSO. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
