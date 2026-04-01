import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // 기본 통계 데이터
  const [
    { count: productCount },
    { count: transactionCount },
    { count: customerCount },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("customers").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  // 최근 거래 요청
  const { data: recentTransactions } = await supabase
    .from("transactions")
    .select("*, product:products(name), customer:customers(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <DashboardClient
      profile={profile}
      stats={{
        products: productCount ?? 0,
        transactions: transactionCount ?? 0,
        customers: customerCount ?? 0,
      }}
      recentTransactions={recentTransactions ?? []}
    />
  );
}
