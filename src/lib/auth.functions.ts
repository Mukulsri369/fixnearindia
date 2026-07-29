import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PLATFORM_ADMIN_EMAIL = "mukul.srivastava.025@gmail.com";

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

export const getTechnicianRegistrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Failed to load technician status: ${profileError.message}`);
    }

    if (!profile) {
      return { hasTechnicianApplication: false, isApproved: false, technicianId: null };
    }

    const { data: technician, error: technicianError } = await context.supabase
      .from("technicians")
      .select("id, is_approved")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (technicianError) {
      throw new Error(`Failed to load technician status: ${technicianError.message}`);
    }

    return {
      hasTechnicianApplication: !!technician,
      isApproved: !!technician?.is_approved,
      technicianId: technician?.id ?? null,
    };
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

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { data: approvedTechnician } = profile
      ? await context.supabase
          .from("technicians")
          .select("id")
          .eq("profile_id", profile.id)
          .eq("is_approved", true)
          .maybeSingle()
      : { data: null };

    const effectiveRoles = approvedTechnician && !roles.includes("technician") ? [...roles, "technician"] : roles;
    const role = roles.includes("admin")
      ? "admin"
      : effectiveRoles.includes("technician")
        ? "technician"
        : (effectiveRoles[0] ?? null);

    return {
      role,
      roles: effectiveRoles,
      isAdmin: roles.includes("admin"),
      isTechnician: effectiveRoles.includes("technician"),
      hasTechnicianApplication: !!approvedTechnician || roles.includes("technician"),
    };
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
    const email = String((context.claims as any)?.email ?? "").trim().toLowerCase();
    const normalizedPhone = data.phone.replace(/\D/g, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Failed to load profile: ${profileError.message}`);
    }

    let profileId = profile?.id;
    if (profileId) {
      const { data: existingTechnician } = await supabaseAdmin
        .from("technicians")
        .select("id, is_approved")
        .eq("profile_id", profileId)
        .maybeSingle();

      if (existingTechnician) {
        throw new Error(
          existingTechnician.is_approved
            ? "Your technician account is already approved. Go to Nearby repair jobs."
            : "Your technician registration is already submitted and waiting for approval.",
        );
      }
    }

    const { data: existingTechnicians } = await supabaseAdmin
      .from("technicians")
      .select("id, profile_id, contact_email, contact_phone, profiles!inner(phone)");

    const duplicate = ((existingTechnicians ?? []) as any[]).find((technician) => {
      const existingEmail = String(technician.contact_email ?? "").trim().toLowerCase();
      const profilePhone = Array.isArray(technician.profiles) ? technician.profiles[0]?.phone : technician.profiles?.phone;
      const existingPhone = String(technician.contact_phone ?? profilePhone ?? "").replace(/\D/g, "");
      return (!!email && existingEmail === email) || (!!normalizedPhone && existingPhone === normalizedPhone);
    });

    if (duplicate) {
      throw new Error("This email address or phone number is already registered as a technician.");
    }

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

    const { data: technician, error: technicianError } = await context.supabase
      .from("technicians")
      .insert({
        profile_id: profileId,
        experience_years: data.experienceYears,
        pincode: data.pincode,
        city: data.city,
        service_radius_km: data.serviceRadiusKm,
        contact_email: email || null,
        contact_phone: data.phone,
        is_approved: false,
        is_available: true,
      } as any)
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
