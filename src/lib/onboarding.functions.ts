import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const draftSchema = z.record(z.string(), z.unknown());

const fileSchema = z.object({
  base64: z.string().min(10),
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(3).max(120),
  kind: z.string().min(1).max(60),
});

/* ------------------------------------------------------------------ */
/* Draft: load / save                                                  */
/* ------------------------------------------------------------------ */

export const getOnboardingState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: draft } = await supabase
      .from("technician_onboarding")
      .select("id, current_step, completion_percent, status, data, submitted_at")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: technician } = profile
      ? await supabase
          .from("technicians")
          .select("id, onboarding_status, completion_percent, review_notes, is_approved, submitted_at")
          .eq("profile_id", profile.id)
          .maybeSingle()
      : { data: null };

    return {
      email: String((context.claims as any)?.email ?? ""),
      profile: profile ?? null,
      draft: draft ?? null,
      technician: technician ?? null,
    };
  });

export const saveOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        currentStep: z.number().int().min(1).max(16),
        completionPercent: z.number().int().min(0).max(100),
        data: draftSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("technician_onboarding")
      .select("id, data")
      .eq("user_id", userId)
      .maybeSingle();

    const merged = { ...(((existing?.data as any) ?? {}) as object), ...data.data };

    if (existing) {
      const { error } = await supabase
        .from("technician_onboarding")
        .update({
          current_step: data.currentStep,
          completion_percent: data.completionPercent,
          data: merged as any,
        })
        .eq("id", existing.id);
      if (error) throw new Error(`Failed to save progress: ${error.message}`);
      return { ok: true, id: existing.id };
    }

    const { data: created, error } = await supabase
      .from("technician_onboarding")
      .insert({
        user_id: userId,
        current_step: data.currentStep,
        completion_percent: data.completionPercent,
        status: "draft",
        data: merged as any,
      })
      .select("id")
      .single();
    if (error || !created) throw new Error(`Failed to save progress: ${error?.message ?? "unknown"}`);
    return { ok: true, id: created.id };
  });

/* ------------------------------------------------------------------ */
/* Secure document upload                                              */
/* ------------------------------------------------------------------ */

export const uploadOnboardingFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => fileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const raw = data.base64.includes(",") ? data.base64.split(",")[1] : data.base64;
    if (!raw) throw new Error("Invalid file");
    const buffer = Buffer.from(raw, "base64");
    if (buffer.byteLength > 8 * 1024 * 1024) throw new Error("File must be smaller than 8 MB");

    const safeKind = data.kind.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${context.userId}/${safeKind}_${Date.now()}_${safeName}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("technician-docs")
      .upload(path, buffer, { contentType: data.contentType, upsert: true });
    if (error) throw new Error(`Upload failed: ${error.message}`);

    return { path, fileName: data.fileName };
  });

/* ------------------------------------------------------------------ */
/* Custom catalog requests                                             */
/* ------------------------------------------------------------------ */

export const createCatalogRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        kind: z.enum(["equipment", "brand", "skill", "service", "category"]),
        name: z.string().min(2).max(120),
        segment: z.string().max(60).optional().nullable(),
        category: z.string().max(120).optional().nullable(),
        brand: z.string().max(120).optional().nullable(),
        modelNumber: z.string().max(120).optional().nullable(),
        description: z.string().max(1000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("custom_catalog_requests").insert({
      user_id: context.userId,
      kind: data.kind,
      name: data.name,
      segment: data.segment ?? null,
      category: data.category ?? null,
      brand: data.brand ?? null,
      model_number: data.modelNumber ?? null,
      description: data.description ?? null,
      status: "pending",
    });
    if (error) throw new Error(`Failed to submit request: ${error.message}`);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Submit the onboarding application                                   */
/* ------------------------------------------------------------------ */

type Draft = Record<string, any>;

export const submitOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const email = String((context.claims as any)?.email ?? "").trim().toLowerCase();

    const { data: draftRow } = await supabase
      .from("technician_onboarding")
      .select("id, data")
      .eq("user_id", userId)
      .maybeSingle();

    const draft = ((draftRow?.data as Draft) ?? {}) as Draft;

    if (!draft.fullName || String(draft.fullName).trim().length < 2) throw new Error("Full name is required");
    if (!draft.phone || String(draft.phone).replace(/\D/g, "").length < 10) throw new Error("A valid phone number is required");
    if (!Array.isArray(draft.segments) || draft.segments.length === 0) throw new Error("Select at least one service segment");
    if (!Array.isArray(draft.equipment) || draft.equipment.length === 0) throw new Error("Select at least one equipment item you service");
    if (!Array.isArray(draft.services) || draft.services.length === 0) throw new Error("Select at least one service offered");
    if (!Array.isArray(draft.serviceAreas) || draft.serviceAreas.length === 0) throw new Error("Add at least one service area");
    if (!Array.isArray(draft.serviceModes) || draft.serviceModes.length === 0) throw new Error("Select at least one service mode");
    if (!Array.isArray(draft.documents) || draft.documents.length === 0) throw new Error("Upload at least one verification document");

    const normalizedPhone = String(draft.phone).replace(/\D/g, "");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    /* profile -------------------------------------------------------- */
    let { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userId).maybeSingle();

    if (!profile) {
      const { data: created, error } = await supabase
        .from("profiles")
        .insert({ user_id: userId, full_name: draft.fullName, phone: draft.phone })
        .select("id")
        .single();
      if (error || !created) throw new Error(`Failed to create profile: ${error?.message ?? "unknown"}`);
      profile = created;
    } else {
      await supabase.from("profiles").update({ full_name: draft.fullName, phone: draft.phone }).eq("id", profile.id);
    }

    /* duplicate guard ------------------------------------------------ */
    const { data: existingTechnician } = await supabaseAdmin
      .from("technicians")
      .select("id, onboarding_status")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (existingTechnician && !["draft", "profile_incomplete", "verification_required", "rejected"].includes(String(existingTechnician.onboarding_status))) {
      throw new Error("Your technician application has already been submitted.");
    }

    const { data: others } = await supabaseAdmin
      .from("technicians")
      .select("id, profile_id, contact_email, contact_phone");

    const duplicate = ((others ?? []) as any[]).find((t) => {
      if (t.profile_id === profile!.id) return false;
      const otherEmail = String(t.contact_email ?? "").trim().toLowerCase();
      const otherPhone = String(t.contact_phone ?? "").replace(/\D/g, "");
      return (!!email && otherEmail === email) || (!!normalizedPhone && otherPhone === normalizedPhone);
    });
    if (duplicate) throw new Error("This email address or phone number is already registered as a technician.");

    /* technician row ------------------------------------------------- */
    const area0 = draft.serviceAreas[0] ?? {};
    const workshop = draft.workshop ?? {};
    const business = draft.business ?? {};

    const technicianPayload = {
      profile_id: profile.id,
      display_name: draft.displayName ?? draft.fullName,
      headline: draft.headline ?? null,
      description: draft.description ?? null,
      business_name: draft.businessName ?? null,
      technician_type: draft.technicianType ?? null,
      contact_email: email || null,
      contact_phone: draft.phone,
      whatsapp_number: draft.whatsappNumber ?? null,
      experience_years: Number(draft.experienceYears ?? 0),
      experience_months: Number(draft.experienceMonths ?? 0),
      segments: draft.segments,
      service_modes: draft.serviceModes,
      availability: draft.availability ?? {},
      pricing: draft.pricing ?? {},
      workshop,
      business,
      gst_number: business.gstNumber ? String(business.gstNumber).toUpperCase() : null,
      state: area0.state ?? null,
      city: area0.city ?? null,
      district: area0.district ?? null,
      pincode: area0.pincode ?? null,
      service_radius_km: Number(area0.radiusKm ?? 10),
      address: workshop.address ?? null,
      onboarding_status: "submitted",
      completion_percent: 100,
      submitted_at: new Date().toISOString(),
      review_notes: null,
      is_approved: false,
      is_available: true,
    } as any;

    let technicianId: string;
    if (existingTechnician) {
      const { error } = await supabase.from("technicians").update(technicianPayload).eq("id", existingTechnician.id);
      if (error) throw new Error(`Failed to submit application: ${error.message}`);
      technicianId = existingTechnician.id;
      await supabase.from("technician_capabilities").delete().eq("technician_id", technicianId);
      await supabase.from("technician_qualifications").delete().eq("technician_id", technicianId);
      await supabase.from("technician_certifications").delete().eq("technician_id", technicianId);
      await supabase.from("technician_documents").delete().eq("technician_id", technicianId);
      await supabase.from("technician_service_areas").delete().eq("technician_id", technicianId);
      await supabase.from("technician_categories").delete().eq("technician_id", technicianId);
    } else {
      const { data: created, error } = await supabase
        .from("technicians")
        .insert(technicianPayload)
        .select("id")
        .single();
      if (error || !created) throw new Error(`Failed to submit application: ${error?.message ?? "unknown"}`);
      technicianId = created.id;
    }

    /* capabilities --------------------------------------------------- */
    const capabilities = (draft.equipment as any[]).map((item) => ({
      technician_id: technicianId,
      segment: item.segment,
      category: item.category,
      equipment: item.equipment,
      experience_years: Number(draft.experienceYears ?? 0),
      skill_level: draft.skillLevel ?? "Intermediate",
      verification_status: "pending",
    }));

    const skillRows = ((draft.skills as string[]) ?? []).map((skill) => ({
      technician_id: technicianId,
      segment: draft.segments[0],
      skill,
      experience_years: Number(draft.experienceYears ?? 0),
      skill_level: draft.skillLevel ?? "Intermediate",
      verification_status: "pending",
    }));

    const brandRows = ((draft.brands as string[]) ?? []).map((brand) => ({
      technician_id: technicianId,
      segment: draft.segments[0],
      brand,
      experience_years: Number(draft.experienceYears ?? 0),
      verification_status: "pending",
    }));

    const serviceRows = ((draft.services as string[]) ?? []).map((service) => ({
      technician_id: technicianId,
      segment: draft.segments[0],
      service,
      experience_years: Number(draft.experienceYears ?? 0),
      verification_status: "pending",
    }));

    const allCapabilities = [...capabilities, ...skillRows, ...brandRows, ...serviceRows];
    if (allCapabilities.length) {
      const { error } = await supabase.from("technician_capabilities").insert(allCapabilities as any);
      if (error) console.error("capabilities insert", error);
    }

    /* service areas -------------------------------------------------- */
    const areaRows = (draft.serviceAreas as any[]).map((area) => ({
      technician_id: technicianId,
      state: area.state,
      city: area.city,
      district: area.district ?? null,
      pincode: area.pincode ?? null,
      locality: area.locality ?? null,
      radius_km: Number(area.radiusKm ?? 10),
      pan_india: !!area.panIndia,
    }));
    if (areaRows.length) {
      const { error } = await supabase.from("technician_service_areas").insert(areaRows as any);
      if (error) console.error("service areas insert", error);
    }

    /* qualifications / certifications -------------------------------- */
    const qualificationRows = ((draft.qualifications as any[]) ?? [])
      .filter((q) => q?.qualification)
      .map((q) => ({
        technician_id: technicianId,
        qualification: q.qualification,
        institute: q.institute ?? null,
        year: q.year ? Number(q.year) : null,
      }));
    if (qualificationRows.length) {
      const { error } = await supabase.from("technician_qualifications").insert(qualificationRows as any);
      if (error) console.error("qualifications insert", error);
    }

    const certificationRows = ((draft.certifications as any[]) ?? [])
      .filter((c) => c?.name)
      .map((c) => ({
        technician_id: technicianId,
        name: c.name,
        issuing_organization: c.issuingOrganization ?? null,
        certificate_number: c.certificateNumber ?? null,
        issue_date: c.issueDate || null,
        expiry_date: c.expiryDate || null,
        certificate_url: c.filePath ?? null,
        verification_status: "pending",
      }));
    if (certificationRows.length) {
      const { error } = await supabase.from("technician_certifications").insert(certificationRows as any);
      if (error) console.error("certifications insert", error);
    }

    /* documents ------------------------------------------------------ */
    const documentRows = (draft.documents as any[]).map((doc) => ({
      technician_id: technicianId,
      document_type: doc.documentType,
      file_path: doc.filePath,
      verification_status: "pending",
    }));
    if (documentRows.length) {
      const { error } = await supabase.from("technician_documents").insert(documentRows as any);
      if (error) console.error("documents insert", error);
    }

    /* payment details ------------------------------------------------ */
    const payment = draft.payment ?? {};
    if (payment.accountNumber || payment.upiId) {
      await supabase.from("technician_payment_details").upsert(
        {
          technician_id: technicianId,
          account_holder_name: payment.accountHolderName ?? null,
          account_number: payment.accountNumber ?? null,
          ifsc: payment.ifsc ? String(payment.ifsc).toUpperCase() : null,
          upi_id: payment.upiId ?? null,
        } as any,
        { onConflict: "technician_id" } as any,
      );
    }

    /* legacy category links so job matching keeps working ------------- */
    const categoryNames = Array.from(new Set((draft.equipment as any[]).map((e) => e.category)));
    const { data: categoryRows } = await supabaseAdmin.from("categories").select("id, name");
    const matched = (categoryRows ?? []).filter((c) =>
      categoryNames.some((name: string) => {
        const a = String(name).toLowerCase();
        const b = String(c.name).toLowerCase();
        return a === b || a.includes(b) || b.includes(a);
      }),
    );
    if (matched.length) {
      await supabase
        .from("technician_categories")
        .insert(matched.map((c) => ({ technician_id: technicianId, category_id: c.id })) as any);
    }

    /* mark draft submitted ------------------------------------------- */
    if (draftRow) {
      await supabase
        .from("technician_onboarding")
        .update({
          technician_id: technicianId,
          status: "submitted",
          current_step: 16,
          completion_percent: 100,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", draftRow.id);
    }

    return { technicianId };
  });

/* ------------------------------------------------------------------ */
/* Admin review                                                        */
/* ------------------------------------------------------------------ */

async function assertAdmin(context: any) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin access required");
}

export const getOnboardingApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("technicians")
      .select(
        `id, display_name, business_name, technician_type, headline, contact_email, contact_phone,
         experience_years, city, state, pincode, segments, service_modes, availability, pricing,
         workshop, business, onboarding_status, completion_percent, review_notes, is_approved,
         submitted_at, created_at,
         profiles (full_name, phone),
         technician_capabilities (segment, category, equipment, skill, brand, service, skill_level, verification_status),
         technician_documents (id, document_type, file_path, verification_status),
         technician_certifications (name, issuing_organization, verification_status),
         technician_qualifications (qualification, institute, year),
         technician_service_areas (state, city, district, pincode, radius_km, pan_india)`,
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to load applications: ${error.message}`);
    return data ?? [];
  });

export const setOnboardingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        technicianId: z.string().uuid(),
        status: z.enum([
          "under_review",
          "verification_required",
          "verified",
          "active",
          "suspended",
          "rejected",
          "inactive",
        ]),
        notes: z.string().max(2000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: technician, error: loadError } = await context.supabase
      .from("technicians")
      .select("id, profile_id")
      .eq("id", data.technicianId)
      .maybeSingle();
    if (loadError || !technician) throw new Error("Technician not found");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("user_id")
      .eq("id", technician.profile_id)
      .maybeSingle();

    const approved = data.status === "active" || data.status === "verified";

    const { error } = await context.supabase
      .from("technicians")
      .update({
        onboarding_status: data.status,
        review_notes: data.notes ?? null,
        reviewed_at: new Date().toISOString(),
        is_approved: approved,
      } as any)
      .eq("id", data.technicianId);
    if (error) throw new Error(`Failed to update application: ${error.message}`);

    if (profile) {
      if (approved) {
        await context.supabase
          .from("user_roles")
          .upsert({ user_id: profile.user_id, role: "technician" }, { onConflict: "user_id, role" });
      } else {
        await context.supabase
          .from("user_roles")
          .delete()
          .eq("user_id", profile.user_id)
          .eq("role", "technician");
      }

      const titles: Record<string, string> = {
        under_review: "Your application is under review",
        verification_required: "Changes requested on your application",
        verified: "Your technician profile is verified",
        active: "You are live on FixNear",
        suspended: "Your technician account is suspended",
        rejected: "Your technician application was rejected",
        inactive: "Your technician account is inactive",
      };
      await context.supabase.from("notifications").insert({
        user_id: profile.user_id,
        type: "onboarding",
        title: titles[data.status] ?? "Application updated",
        body: data.notes ?? null,
        data: { technicianId: data.technicianId, status: data.status } as any,
      } as any);
    }

    return { ok: true };
  });

export const getCatalogRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("custom_catalog_requests")
      .select("id, kind, name, segment, category, brand, model_number, description, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to load catalog requests: ${error.message}`);
    return data ?? [];
  });

export const setCatalogRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ requestId: z.string().uuid(), status: z.enum(["pending", "approved", "rejected"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("custom_catalog_requests")
      .update({ status: data.status })
      .eq("id", data.requestId);
    if (error) throw new Error(`Failed to update request: ${error.message}`);
    return { ok: true };
  });

export const getTechnicianDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ path: z.string().min(3).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("technician-docs")
      .createSignedUrl(data.path, 300);
    if (error || !signed) throw new Error(`Failed to open document: ${error?.message ?? "unknown"}`);
    return { url: signed.signedUrl };
  });
