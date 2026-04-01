import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MembersClient from "./members-client";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: members } = await supabase
    .from("users")
    .select("*")
    .eq("role", "cso")
    .order("created_at", { ascending: false });

  return (
    <MembersClient
      profile={profile}
      members={members ?? []}
    />
  );
}
