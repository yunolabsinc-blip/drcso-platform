import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FavoritesClient from "./favorites-client";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select("*, product:products(*, company:companies(name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <FavoritesClient
      profile={profile}
      favorites={favorites ?? []}
    />
  );
}
