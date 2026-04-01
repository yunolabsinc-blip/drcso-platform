import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EdiScanClient from "./edi-scan-client";

export default async function EdiScanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: products } = await supabase
    .from("products")
    .select("id, name, base_price, commission_rate, commission_amount");

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", user.id);

  return (
    <EdiScanClient
      profile={profile}
      products={products ?? []}
      customers={customers ?? []}
    />
  );
}
