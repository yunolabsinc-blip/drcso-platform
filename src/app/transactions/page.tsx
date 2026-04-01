import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransactionsClient from "./transactions-client";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, product:products(id, name, base_price, commission_rate, commission_amount, company:companies(name)), customer:customers(id, name, type)")
    .order("created_at", { ascending: false });

  // CSO 딜러용: 제품 목록, 거래처 목록
  const { data: products } = await supabase
    .from("products")
    .select("id, name, company:companies(name)")
    .eq("is_tradeable", true)
    .eq("sale_status", "on_sale");

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, type")
    .eq("user_id", user.id);

  return (
    <TransactionsClient
      profile={profile}
      transactions={transactions ?? []}
      products={(products ?? []) as unknown as { id: string; name: string; company: { name: string } | null }[]}
      customers={customers ?? []}
    />
  );
}
