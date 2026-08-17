/** Server-only notification helpers (service role: writes rows for other users). */

type NewRequestInfo = {
  requestId: string;
  categoryId: string | null;
  city: string | null;
  pincode: string | null;
  categoryName?: string | null;
  brand?: string | null;
  model?: string | null;
};

/** Notifies approved technicians in the same category whose city or pincode area matches. */
export async function notifyMatchingTechnicians(info: NewRequestInfo) {
  if (!info.categoryId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: techs } = await supabaseAdmin
    .from("technicians")
    .select("id, city, pincode, is_approved, is_available, profile_id, technician_categories!inner (category_id)")
    .eq("is_approved", true)
    .eq("technician_categories.category_id", info.categoryId);

  if (!techs?.length) return;

  const prefix = (info.pincode ?? "").slice(0, 3);
  const city = (info.city ?? "").toLowerCase();

  const matched = techs.filter((t: any) => {
    const sameCity = !!city && (t.city ?? "").toLowerCase() === city;
    const samePin = !!prefix && (t.pincode ?? "").startsWith(prefix);
    return sameCity || samePin;
  });
  if (!matched.length) return;

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id")
    .in("id", matched.map((t: any) => t.profile_id));

  const userIds = (profiles ?? []).map((p) => p.user_id).filter(Boolean);
  if (!userIds.length) return;

  const device = [info.brand, info.model].filter(Boolean).join(" ") || info.categoryName || "device";

  await supabaseAdmin.from("notifications").insert(
    userIds.map((user_id) => ({
      user_id,
      type: "new_request",
      title: "New repair job near you",
      body: `${device} repair needed in ${info.city ?? "your area"}${info.pincode ? ` (${info.pincode})` : ""}.`,
      data: { repair_request_id: info.requestId },
    }))
  );
}

/** Notifies a technician (by technician row id) that the customer picked them. */
export async function notifyTechnicianSelected(technicianId: string, requestId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: tech } = await supabaseAdmin
    .from("technicians")
    .select("profile_id")
    .eq("id", technicianId)
    .maybeSingle();
  if (!tech?.profile_id) return;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("id", tech.profile_id)
    .maybeSingle();
  if (!profile?.user_id) return;

  await supabaseAdmin.from("notifications").insert({
    user_id: profile.user_id,
    type: "assignment_accepted",
    title: "You've been selected for a repair job",
    body: "The customer accepted your offer. Open your jobs to start the repair.",
    data: { repair_request_id: requestId },
  });
}
