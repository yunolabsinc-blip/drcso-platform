import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EdiClient from "./edi-client";

export default async function EdiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: ediRecords } = await supabase
    .from("edi_records")
    .select("*, product:products(name, commission_rate), customer:customers(name)")
    .order("edi_date", { ascending: false });

  // 제품/거래처 목록 (등록 폼용)
  const { data: products } = await supabase
    .from("products")
    .select("id, name, base_price, commission_rate, commission_amount");

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", user.id);

  // 월별 요약
  const records = ediRecords ?? [];
  const monthlySummary = records.reduce<Record<string, { amount: number; commission: number; count: number }>>((acc, r) => {
    const month = r.edi_date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = { amount: 0, commission: 0, count: 0 };
    acc[month].amount += r.amount;
    acc[month].commission += r.commission;
    acc[month].count += r.quantity;
    return acc;
  }, {});

  return (
    <EdiClient
      profile={profile}
      ediRecords={records}
      products={products ?? []}
      customers={customers ?? []}
      monthlySummary={monthlySummary}
    />
  );
}
