import { supabase } from "../lib/supabaseClient.js";
import { getMyProfile } from "./profiles.js";

/** Registers the signed-in user as a technician and grants the technician role. */
export async function registerTechnician(user, values) {
  let profile = await getMyProfile(user.id);

  if (!profile) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({ user_id: user.id, full_name: values.fullName, phone: values.phone })
      .select("id")
      .single();
    if (error) throw new Error(`Failed to create profile: ${error.message}`);
    profile = data;
  } else {
    await supabase
      .from("profiles")
      .update({ full_name: values.fullName, phone: values.phone })
      .eq("id", profile.id);
  }

  const existing = await getTechnicianByUser(user.id);
  if (existing) throw new Error("You have already submitted a technician application.");

  const { data: technician, error: techError } = await supabase
    .from("technicians")
    .insert({
      profile_id: profile.id,
      business_name: values.businessName || null,
      experience_years: values.experienceYears,
      address: values.address || null,
      city: values.city,
      state: values.state || null,
      pincode: values.pincode,
      service_radius_km: values.serviceRadiusKm,
      is_approved: false,
      is_available: true,
    })
    .select("id")
    .single();

  if (techError) throw new Error(`Failed to register: ${techError.message}`);

  await supabase.from("user_roles").insert({ user_id: user.id, role: "technician" });

  if (values.categoryIds?.length) {
    const { error: linkError } = await supabase.from("technician_categories").insert(
      values.categoryIds.map((categoryId) => ({
        technician_id: technician.id,
        category_id: categoryId,
      })),
    );
    if (linkError) console.error("Category link error:", linkError.message);
  }

  return technician;
}

export async function getTechnicianByUser(userId) {
  const profile = await getMyProfile(userId);
  if (!profile) return null;

  const { data, error } = await supabase
    .from("technicians")
    .select(
      `id, business_name, experience_years, city, state, pincode, address,
       service_radius_km, is_approved, is_available, avg_rating, total_reviews,
       technician_categories (category_id, categories (id, name))`,
    )
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load technician: ${error.message}`);
  return data;
}

export async function setAvailability(technicianId, isAvailable) {
  const { error } = await supabase
    .from("technicians")
    .update({ is_available: isAvailable })
    .eq("id", technicianId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/**
 * Finds approved + available technicians who cover the request's category and
 * are either in the same city or share the first 3 digits of the pincode.
 */
export async function findMatchingTechnicians(request) {
  if (!request?.category_id) throw new Error("Request has no category");

  let query = supabase
    .from("technicians")
    .select(
      `id, business_name, experience_years, service_radius_km, city, state, pincode,
       avg_rating, total_reviews, is_approved, is_available,
       profiles (full_name, phone, avatar_url),
       technician_categories!inner (category_id)`,
    )
    .eq("is_approved", true)
    .eq("is_available", true)
    .eq("technician_categories.category_id", request.category_id);

  const filters = [];
  if (request.city) filters.push(`city.ilike.${request.city}`);
  if (request.pincode) filters.push(`pincode.like.${request.pincode.slice(0, 3)}%`);
  if (filters.length) query = query.or(filters.join(","));

  const { data, error } = await query;
  if (error) throw new Error(`Failed to find technicians: ${error.message}`);
  return data ?? [];
}
