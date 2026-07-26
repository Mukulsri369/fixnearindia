import { supabase } from "../lib/supabaseClient.js";

export async function listCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description")
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data ?? [];
}

export async function getCategoryBySlug(slug) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
