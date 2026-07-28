import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const technicianSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  categoryIds: z.array(z.string().uuid()).min(1),
  experienceYears: z.number().int().min(0).max(60),
  pincode: z.string().min(6).max(10),
  city: z.string().min(2).max(100),
  serviceRadiusKm: z.number().int().min(1).max(100),
});

export const getCurrentUserProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load profile: ${error.message}`);
    }

    return data;
  });

export const getCurrentUserRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    if (error) {
      throw new Error(`Failed to load role: ${error.message}`);
    }

    const roles = (data ?? []).map((r) => r.role as string);
    const role = roles.includes("admin")
      ? "admin"
      : roles.includes("technician")
        ? "technician"
        : (roles[0] ?? null);

    return { role, roles, isAdmin: roles.includes("admin"), isTechnician: roles.includes("technician") };
  });


export const createProfileIfMissing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existingProfile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await context.supabase.from("profiles").insert({
        user_id: context.userId,
      });
      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      const { error: roleError } = await context.supabase.from("user_roles").insert({
        user_id: context.userId,
        role: "customer",
      });
      if (roleError) {
        console.error("Role creation error:", roleError);
      }
    }

    // The platform owner is always an admin.
    const email = String((context.claims as any)?.email ?? "").toLowerCase();
    if (email === PLATFORM_ADMIN_EMAIL) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id, role" });
    }

    return { ok: true };

  });

export const registerTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => technicianSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Failed to load profile: ${profileError.message}`);
    }

    let profileId = profile?.id;
    if (!profileId) {
      const { data: newProfile, error: createError } = await context.supabase
        .from("profiles")
        .insert({ user_id: context.userId, full_name: data.fullName, phone: data.phone })
        .select("id")
        .single();
      if (createError || !newProfile) {
        throw new Error(`Failed to create profile: ${createError?.message ?? "Unknown error"}`);
      }
      profileId = newProfile.id;
    } else {
      const { error: updateError } = await context.supabase
        .from("profiles")
        .update({ full_name: data.fullName, phone: data.phone })
        .eq("id", profileId);
      if (updateError) {
        console.error("Profile update error:", updateError);
      }
    }

    const { error: roleUpsertError } = await context.supabase
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "technician" }, { onConflict: "user_id, role" });

    if (roleUpsertError) {
      console.error("Role upsert error:", roleUpsertError);
    }

    const { data: technician, error: technicianError } = await context.supabase
      .from("technicians")
      .insert({
        profile_id: profileId,
        experience_years: data.experienceYears,
        pincode: data.pincode,
        city: data.city,
        service_radius_km: data.serviceRadiusKm,
        is_approved: false,
        is_available: true,
      })
      .select("id")
      .single();

    if (technicianError || !technician) {
      throw new Error(`Failed to register technician: ${technicianError?.message ?? "Unknown error"}`);
    }

    const categoryLinks = data.categoryIds.map((categoryId) => ({
      technician_id: technician.id,
      category_id: categoryId,
    }));

    const { error: categoriesError } = await context.supabase
      .from("technician_categories")
      .insert(categoryLinks);

    if (categoriesError) {
      console.error("Technician categories error:", categoriesError);
    }

    return { technicianId: technician.id };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.auth.signOut();
  return { ok: true };
});
