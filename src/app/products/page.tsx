import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: products } = await supabase
    .from("products")
    .select("*, company:companies(name)")
    .order("created_at", { ascending: false });

  // 사용자의 찜 목록
  const { data: favorites } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", user.id);

  const favoriteIds = new Set(favorites?.map((f) => f.product_id) ?? []);

  // admin용: 회사 목록
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .order("name");

  return (
    <ProductsClient
      profile={profile}
      products={products ?? []}
      favoriteIds={Array.from(favoriteIds)}
      companies={companies ?? []}
    />
  );
}
