import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/* Technician context                                                  */
/* ------------------------------------------------------------------ */

export const getTechnicianContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!profile) return { isTechnician: false, isApproved: false, technicianId: null, categoryIds: [] as string[] };

    const { data: technician } = await context.supabase
      .from("technicians")
      .select("id, is_approved, is_available, city, pincode, technician_categories (category_id)")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!technician) return { isTechnician: false, isApproved: false, technicianId: null, categoryIds: [] as string[] };

    return {
      isTechnician: true,
      isApproved: !!technician.is_approved,
      technicianId: technician.id,
      city: technician.city,
      pincode: technician.pincode,
      categoryIds: (technician.technician_categories ?? []).map((c: { category_id: string }) => c.category_id),
    };
  });

/* ------------------------------------------------------------------ */
/* Technician: nearby open requests + express interest                 */
/* ------------------------------------------------------------------ */

export const getAvailableRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        state: z.string().max(100).nullable().optional(),
        city: z.string().max(100).nullable().optional(),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    const empty = {
      isTechnician: false,
      isApproved: false,
      requests: [] as any[],
      states: [] as string[],
      cities: [] as string[],
    };

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) return empty;

    const { data: technician } = await context.supabase
      .from("technicians")
      .select("id, is_approved, city, state, pincode, technician_categories (category_id)")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (!technician) return empty;
    if (!technician.is_approved) return { ...empty, isTechnician: true };

    const categoryIds = (technician.technician_categories ?? []).map((c: { category_id: string }) => c.category_id);
    if (categoryIds.length === 0) return { ...empty, isTechnician: true, isApproved: true };

    // All open requests limited to the technician's repair categories
    const { data: allRequests, error } = await context.supabase
      .from("repair_requests")
      .select(
        `id, brand, model, issue_description, priority, city, state, pincode, address,
         preferred_visit_time, status, created_at, categories (name)`
      )
      .eq("status", "open")
      .in("category_id", categoryIds)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(`Failed to load nearby requests: ${error.message}`);

    const rows = allRequests ?? [];

    const states = Array.from(new Set(rows.map((r) => r.state).filter(Boolean) as string[])).sort();
    const selectedState = data.state?.trim() || null;
    const selectedCity = data.city?.trim() || null;

    const cities = Array.from(
      new Set(
        rows
          .filter((r) => !selectedState || r.state === selectedState)
          .map((r) => r.city)
          .filter(Boolean) as string[]
      )
    ).sort();

    let filtered = rows;
    if (selectedState) filtered = filtered.filter((r) => r.state === selectedState);
    if (selectedCity) filtered = filtered.filter((r) => (r.city ?? "").toLowerCase() === selectedCity.toLowerCase());

    const ids = filtered.map((r) => r.id);
    let interestedIds: string[] = [];
    if (ids.length) {
      const { data: mine } = await context.supabase
        .from("request_assignments")
        .select("repair_request_id")
        .eq("technician_id", technician.id)
        .in("repair_request_id", ids);
      interestedIds = (mine ?? []).map((m) => m.repair_request_id);
    }

    // Prefer requests near the technician's own base (same city or pincode area)
    const prefix = (technician.pincode ?? "").slice(0, 3);
    const scored = filtered.map((r) => ({
      ...r,
      alreadyInterested: interestedIds.includes(r.id),
      isNearby:
        (!!technician.city && r.city?.toLowerCase() === technician.city.toLowerCase()) ||
        (!!prefix && (r.pincode ?? "").startsWith(prefix)),
    }));
    scored.sort((a, b) => Number(b.isNearby) - Number(a.isNearby));

    return { isTechnician: true, isApproved: true, requests: scored, states, cities };
  });

export const expressInterest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ requestId: z.string().uuid(), message: z.string().min(5).max(1000) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) throw new Error("You are not registered as a technician");

    const { data: technician } = await context.supabase
      .from("technicians")
      .select("id, is_approved")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (!technician) throw new Error("You are not registered as a technician");
    if (!technician.is_approved) throw new Error("Your technician account is awaiting admin approval");

    const { data: existing } = await context.supabase
      .from("request_assignments")
      .select("id, status")
      .eq("repair_request_id", data.requestId)
      .eq("technician_id", technician.id)
      .maybeSingle();

    if (!existing) {
      const { error } = await context.supabase.from("request_assignments").insert({
        repair_request_id: data.requestId,
        technician_id: technician.id,
        status: "interested",
      });
      if (error) throw new Error(`Failed to submit interest: ${error.message}`);
    }

    const { error: msgError } = await context.supabase.from("request_messages").insert({
      repair_request_id: data.requestId,
      technician_id: technician.id,
      sender_id: context.userId,
      sender_role: "technician",
      body: data.message,
    });
    if (msgError) throw new Error(`Failed to post message: ${msgError.message}`);

    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

export const getRequestMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from("request_messages")
      .select("id, body, sender_role, technician_id, sender_id, created_at")
      .eq("repair_request_id", data.requestId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to load messages: ${error.message}`);
    return messages ?? [];
  });

export const postRequestMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        requestId: z.string().uuid(),
        technicianId: z.string().uuid().nullable().optional(),
        body: z.string().min(1).max(1000),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { data: request } = await context.supabase
      .from("repair_requests")
      .select("customer_id")
      .eq("id", data.requestId)
      .maybeSingle();

    const isCustomer = request?.customer_id === context.userId;
    let technicianId = data.technicianId ?? null;

    if (!isCustomer) {
      const { data: profile } = await context.supabase
        .from("profiles")
        .select("id")
        .eq("user_id", context.userId)
        .maybeSingle();
      const { data: technician } = profile
        ? await context.supabase.from("technicians").select("id").eq("profile_id", profile.id).maybeSingle()
        : { data: null };
      if (!technician) throw new Error("You cannot post on this request");
      technicianId = technician.id;
    }

    const { error } = await context.supabase.from("request_messages").insert({
      repair_request_id: data.requestId,
      technician_id: technicianId,
      sender_id: context.userId,
      sender_role: isCustomer ? "customer" : "technician",
      body: data.body,
    });

    if (error) throw new Error(`Failed to send message: ${error.message}`);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Customer: interested technicians + selection                        */
/* ------------------------------------------------------------------ */

export const getRequestInterests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: interests, error } = await context.supabase
      .from("request_assignments")
      .select(
        `id, status, created_at, accepted_at, completed_at, amount, repair_notes, parts_replaced,
         technicians (id, business_name, experience_years, city, avg_rating, total_reviews, profiles (full_name, phone))`
      )
      .eq("repair_request_id", data.requestId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to load technicians: ${error.message}`);
    return interests ?? [];
  });

export const selectTechnician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ requestId: z.string().uuid(), assignmentId: z.string().uuid() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { data: request } = await context.supabase
      .from("repair_requests")
      .select("customer_id, status")
      .eq("id", data.requestId)
      .maybeSingle();

    if (!request) throw new Error("Repair request not found");
    if (request.customer_id !== context.userId) throw new Error("You can only assign your own requests");
    if (request.status !== "open") throw new Error("This request already has an assigned technician");

    const { data: accepted, error: acceptError } = await context.supabase
      .from("request_assignments")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", data.assignmentId)
      .eq("repair_request_id", data.requestId)
      .select("technician_id")
      .maybeSingle();
    if (acceptError) throw new Error(`Failed to assign technician: ${acceptError.message}`);

    await context.supabase
      .from("request_assignments")
      .update({ status: "rejected" })
      .eq("repair_request_id", data.requestId)
      .neq("id", data.assignmentId);

    const { error: statusError } = await context.supabase
      .from("repair_requests")
      .update({ status: "assigned" })
      .eq("id", data.requestId);
    if (statusError) throw new Error(`Failed to update request: ${statusError.message}`);

    if (accepted?.technician_id) {
      try {
        const { notifyTechnicianSelected } = await import("./notify.server");
        await notifyTechnicianSelected(accepted.technician_id, data.requestId);
      } catch (notifyError) {
        console.error("Failed to notify technician", notifyError);
      }
    }

    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Technician: jobs, work log, completion + invoice                    */
/* ------------------------------------------------------------------ */

export const startJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ assignmentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: assignment, error } = await context.supabase
      .from("request_assignments")
      .update({ status: "in_progress" })
      .eq("id", data.assignmentId)
      .select("repair_request_id")
      .maybeSingle();

    if (error || !assignment) throw new Error(`Failed to start job: ${error?.message ?? "not found"}`);

    await context.supabase
      .from("repair_requests")
      .update({ status: "in_progress" })
      .eq("id", assignment.repair_request_id);

    return { ok: true };
  });

export const completeJobWithInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        assignmentId: z.string().uuid(),
        repairNotes: z.string().min(10).max(2000),
        partsReplaced: z.string().max(2000).optional(),
        amount: z.number().min(0).max(1000000),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { data: assignment, error: loadError } = await context.supabase
      .from("request_assignments")
      .select("id, technician_id, repair_request_id, status")
      .eq("id", data.assignmentId)
      .maybeSingle();

    if (loadError || !assignment) throw new Error("Assignment not found");

    const { data: request } = await context.supabase
      .from("repair_requests")
      .select("customer_id")
      .eq("id", assignment.repair_request_id)
      .maybeSingle();
    if (!request) throw new Error("Repair request not found");

    const { error: updateError } = await context.supabase
      .from("request_assignments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        repair_notes: data.repairNotes,
        parts_replaced: data.partsReplaced ?? null,
        amount: data.amount,
      })
      .eq("id", data.assignmentId);
    if (updateError) throw new Error(`Failed to complete job: ${updateError.message}`);

    const { error: invoiceError } = await context.supabase.from("invoices").upsert(
      {
        assignment_id: assignment.id,
        repair_request_id: assignment.repair_request_id,
        technician_id: assignment.technician_id,
        customer_id: request.customer_id,
        amount: data.amount,
        repair_notes: data.repairNotes,
        parts_replaced: data.partsReplaced ?? null,
        status: "issued",
      },
      { onConflict: "assignment_id" }
    );
    if (invoiceError) throw new Error(`Failed to generate invoice: ${invoiceError.message}`);

    await context.supabase
      .from("repair_requests")
      .update({ status: "awaiting_payment" })
      .eq("id", assignment.repair_request_id);

    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

export const getInvoiceForRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: invoice, error } = await context.supabase
      .from("invoices")
      .select(
        `id, amount, repair_notes, parts_replaced, status, approved_at, paid_at, created_at,
         technicians (id, business_name, profiles (full_name, phone))`
      )
      .eq("repair_request_id", data.requestId)
      .maybeSingle();

    if (error) throw new Error(`Failed to load invoice: ${error.message}`);
    return invoice;
  });

export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ invoiceId: z.string().uuid(), action: z.enum(["approve", "pay"]) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { data: invoice, error: loadError } = await context.supabase
      .from("invoices")
      .select("id, customer_id, repair_request_id, status")
      .eq("id", data.invoiceId)
      .maybeSingle();

    if (loadError || !invoice) throw new Error("Invoice not found");
    if (invoice.customer_id !== context.userId) throw new Error("Only the customer can approve or pay this invoice");

    const now = new Date().toISOString();
    const updates =
      data.action === "approve"
        ? { status: "approved", approved_at: now }
        : { status: "paid", paid_at: now };

    const { error } = await context.supabase.from("invoices").update(updates).eq("id", data.invoiceId);
    if (error) throw new Error(`Failed to update invoice: ${error.message}`);

    if (data.action === "pay") {
      await context.supabase
        .from("repair_requests")
        .update({ status: "closed" })
        .eq("id", invoice.repair_request_id);
    }

    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Admin: technician approvals                                         */
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

export const getAdminTechnicians = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);

    const { data, error } = await context.supabase
      .from("technicians")
      .select(
        `id, business_name, experience_years, city, state, pincode, is_approved, is_available,
         avg_rating, total_reviews, created_at,
         profiles (full_name, phone),
         technician_categories (categories (name))`
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load technicians: ${error.message}`);
    return data ?? [];
  });

export const setTechnicianApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ technicianId: z.string().uuid(), approve: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);

    const { data: technician, error: technicianLoadError } = await context.supabase
      .from("technicians")
      .select("id, profile_id")
      .eq("id", data.technicianId)
      .maybeSingle();

    if (technicianLoadError || !technician) {
      throw new Error(`Failed to load technician: ${technicianLoadError?.message ?? "not found"}`);
    }

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("user_id")
      .eq("id", technician.profile_id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error(`Failed to load technician profile: ${profileError?.message ?? "not found"}`);
    }

    const { error } = await context.supabase
      .from("technicians")
      .update({ is_approved: data.approve })
      .eq("id", data.technicianId);

    if (error) throw new Error(`Failed to update technician: ${error.message}`);

    if (data.approve) {
      const { error: roleError } = await context.supabase
        .from("user_roles")
        .upsert({ user_id: profile.user_id, role: "technician" }, { onConflict: "user_id, role" });

      if (roleError) throw new Error(`Failed to update technician role: ${roleError.message}`);
    } else {
      const { error: roleError } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", profile.user_id)
        .eq("role", "technician");

      if (roleError) throw new Error(`Failed to update technician role: ${roleError.message}`);
    }

    return { ok: true };
  });
