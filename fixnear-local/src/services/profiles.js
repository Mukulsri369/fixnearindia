import { supabase } from "../lib/supabaseClient.js";

/** Returns the profile row of the given auth user. */
export async function getMyProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, phone, avatar_url, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data;
}

/** Creates the profile + customer role rows if the signup trigger did not run. */
export async function ensureProfile(user) {
  const existing = await getMyProfile(user.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      full_name: user.user_metadata?.full_name ?? null,
    })
    .select("id, user_id, full_name, phone, avatar_url, created_at")
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);

  await supabase.from("user_roles").insert({ user_id: user.id, role: "customer" });
  return data;
}

export async function updateProfile(userId, values) {
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: values.fullName,
      phone: values.phone,
      avatar_url: values.avatarUrl ?? null,
    })
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return { ok: true };
}

/** Highest-privilege role of the user: admin > technician > customer. */
export async function getRole(userId) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to load roles:", error.message);
    return null;
  }

  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("technician")) return "technician";
  if (roles.includes("customer")) return "customer";
  return null;
}
