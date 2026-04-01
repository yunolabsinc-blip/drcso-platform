import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomersClient from "./customers-client";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <CustomersClient
      profile={profile}
      customers={customers ?? []}
    />
  );
}
