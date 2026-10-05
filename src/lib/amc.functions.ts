import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const amcRequestSchema = z.object({
  assetId: z.string().uuid(),
  requestedDays: z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365)]),
  serviceNotes: z.string().trim().min(10).max(2000),
  address: z.string().trim().max(500).optional(),
  state: z.string().trim().max(100).optional(),
  city: z.string().trim().min(2).max(100),
  pincode: z.string().trim().min(6).max(10),
  sourceRepairRequestId: z.string().uuid().optional(),
  invitedTechnicianId: z.string().uuid().optional(),
});

async function technicianForUser(context: any) {
  const { data: profile } = await context.supabase
    .from("profiles").select("id").eq("user_id", context.userId).maybeSingle();
  if (!profile) return null;
  const { data: technician } = await context.supabase
    .from("technicians").select("id, is_approved, city, state, pincode, technician_categories(category_id)")
    .eq("profile_id", profile.id).maybeSingle();
  return technician;
}

export const createAmcRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => amcRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: asset } = await context.supabase
      .from("customer_assets")
      .select("id, category_id, name, brand, model")
      .eq("id", data.assetId)
      .eq("customer_id", context.userId)
      .maybeSingle();
    if (!asset) throw new Error("Select an asset registered to your account");

    if (data.sourceRepairRequestId || data.invitedTechnicianId) {
      if (!data.sourceRepairRequestId || !data.invitedTechnicianId) throw new Error("The repair and technician must be provided together");
      const { data: completed } = await context.supabase
        .from("request_assignments")
        .select("technician_id, repair_requests!inner(customer_id, asset_id)")
        .eq("repair_request_id", data.sourceRepairRequestId)
        .eq("technician_id", data.invitedTechnicianId)
        .eq("status", "completed")
        .maybeSingle();
      if (!completed || completed.repair_requests?.customer_id !== context.userId || completed.repair_requests?.asset_id !== asset.id) {
        throw new Error("This repair cannot be converted to an AMC");
      }
    }

    const { data: existing } = await context.supabase
      .from("amc_requests").select("id, status").eq("asset_id", asset.id).in("status", ["open", "selected", "active"]).maybeSingle();
    if (existing) return { requestId: existing.id, existing: true };

    const { data: request, error } = await context.supabase.from("amc_requests").insert({
      customer_id: context.userId,
      asset_id: asset.id,
      category_id: asset.category_id,
      requested_days: data.requestedDays,
      service_notes: data.serviceNotes,
      address: data.address || null,
      state: data.state || null,
      city: data.city,
      pincode: data.pincode,
      source_repair_request_id: data.sourceRepairRequestId || null,
      invited_technician_id: data.invitedTechnicianId || null,
    }).select("id").single();
    if (error || !request) {
      if (error?.code === "23505") throw new Error("This asset already has an open or active AMC");
      throw new Error(`Failed to create AMC request: ${error?.message ?? "unknown"}`);
    }

    try {
      const { notifyAmcOpportunity } = await import("./notify.server");
      await notifyAmcOpportunity({
        requestId: request.id,
        categoryId: asset.category_id,
        city: data.city,
        pincode: data.pincode,
        assetName: asset.name,
        invitedTechnicianId: data.invitedTechnicianId ?? null,
      });
    } catch (error) {
      console.error("Failed to notify technicians about AMC", error);
    }
    return { requestId: request.id, existing: false };
  });

export const getMyAmcs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { processAmcLifecycle } = await import("./amc-lifecycle.server");
    await processAmcLifecycle();
    const { data, error } = await context.supabase.from("amc_requests").select(
      `id, requested_days, service_notes, city, status, created_at,
       customer_assets(id, name, brand, model),
       amc_contracts(id, status, starts_at, ends_at, price, response_sla_hours,
         technicians(id, business_name, profiles(full_name, phone)))`
    ).eq("customer_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to load AMCs: ${error.message}`);
    return (data ?? []).map((row) => ({
      ...row,
      amc_contracts: row.amc_contracts
        ? (Array.isArray(row.amc_contracts) ? row.amc_contracts : [row.amc_contracts])
        : [],
    })) as any[];
  });

export const getAmcDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { processAmcLifecycle } = await import("./amc-lifecycle.server");
    await processAmcLifecycle();
    const { data: request, error } = await context.supabase.from("amc_requests").select(
      `id, customer_id, asset_id, requested_days, service_notes, address, state, city, pincode,
       invited_technician_id, source_repair_request_id, selected_offer_id, status, created_at,
       customer_assets(id, name, brand, model, serial_number, categories(name)),
       amc_offers(id, technician_id, price, coverage_details, terms, status, paid_at, created_at,
         technicians(id, business_name, city, experience_years, avg_rating, profiles(full_name, phone))),
       amc_contracts(id, technician_id, duration_days, price, response_sla_hours, starts_at, ends_at,
         status, paid_at, cancelled_at, cancellation_reason, technicians(id, business_name, profiles(full_name, phone)))`
    ).eq("id", data.requestId).maybeSingle();
    if (error || !request) throw new Error("AMC request not found");

    const offers = request.amc_offers
      ? (Array.isArray(request.amc_offers) ? request.amc_offers : [request.amc_offers])
      : [];
    const contracts = request.amc_contracts
      ? (Array.isArray(request.amc_contracts) ? request.amc_contracts : [request.amc_contracts])
      : [];
    const contract = contracts[0] ?? null;
    let repairs: any[] = [];
    if (contract) {
      const { data: repairRows } = await context.supabase.from("repair_requests").select(
        "id, issue_description, status, priority, created_at, response_due_at, request_assignments(id, status, accepted_at, completed_at)"
      ).eq("amc_contract_id", contract.id).order("created_at", { ascending: false });
      repairs = repairRows ?? [];
    }
    const technician = await technicianForUser(context);
    return { request: { ...request, amc_offers: offers, amc_contracts: contracts } as any, contract: contract as any, repairs, isCustomer: request.customer_id === context.userId, technicianId: technician?.id ?? null };
  });

export const getAmcMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase.from("amc_messages")
      .select("id, body, sender_role, technician_id, sender_id, created_at")
      .eq("amc_request_id", data.requestId).order("created_at", { ascending: true });
    if (error) throw new Error(`Failed to load AMC messages: ${error.message}`);
    return messages ?? [];
  });

export const postAmcMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid(), body: z.string().trim().min(1).max(1000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request } = await context.supabase.from("amc_requests").select("customer_id").eq("id", data.requestId).maybeSingle();
    if (!request) throw new Error("AMC request not found");
    const isCustomer = request.customer_id === context.userId;
    const technician = isCustomer ? null : await technicianForUser(context);
    if (!isCustomer && !technician) throw new Error("Only AMC participants can send messages");
    const { error } = await context.supabase.from("amc_messages").insert({
      amc_request_id: data.requestId,
      technician_id: technician?.id ?? null,
      sender_id: context.userId,
      sender_role: isCustomer ? "customer" : "technician",
      body: data.body,
    });
    if (error) throw new Error(`Failed to send message: ${error.message}`);
    return { ok: true };
  });

export const getTechnicianAmcs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { processAmcLifecycle } = await import("./amc-lifecycle.server");
    await processAmcLifecycle();
    const technician = await technicianForUser(context);
    if (!technician) return { isTechnician: false, isApproved: false, technicianId: null, opportunities: [], contracts: [] };
    if (!technician.is_approved) return { isTechnician: true, isApproved: false, technicianId: technician.id, opportunities: [], contracts: [] };
    const categoryIds = (technician.technician_categories ?? []).map((row: any) => row.category_id);
    let query = context.supabase.from("amc_requests").select(
      "id, requested_days, service_notes, city, state, pincode, invited_technician_id, status, created_at, customer_assets(id, name, brand, model, categories(name)), amc_offers!amc_offers_amc_request_id_fkey(id, technician_id, price, status)"
    ).eq("status", "open").order("created_at", { ascending: false });
    if (categoryIds.length) query = query.in("category_id", categoryIds);
    const { data: opportunities, error } = await query;
    if (error) throw new Error(`Failed to load AMC requests: ${error.message}`);
    const visible = (opportunities ?? []).filter((row: any) => !row.invited_technician_id || row.invited_technician_id === technician.id);
    const { data: contracts, error: contractError } = await context.supabase.from("amc_contracts").select(
      "id, amc_request_id, asset_id, duration_days, price, starts_at, ends_at, status, response_sla_hours, amc_requests(city, customer_assets(id, name, brand, model))"
    ).eq("technician_id", technician.id).order("created_at", { ascending: false });
    if (contractError) throw new Error(`Failed to load AMC contracts: ${contractError.message}`);
    return { isTechnician: true, isApproved: true, technicianId: technician.id, opportunities: visible, contracts: contracts ?? [] };
  });

export const submitAmcOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    requestId: z.string().uuid(), price: z.number().min(0).max(10000000),
    coverageDetails: z.string().trim().min(10).max(2000), terms: z.string().trim().max(2000).optional(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const technician = await technicianForUser(context);
    if (!technician?.is_approved) throw new Error("An approved technician account is required");
    const { data: existing } = await context.supabase.from("amc_offers").select("id").eq("amc_request_id", data.requestId).eq("technician_id", technician.id).maybeSingle();
    if (existing) throw new Error("You already sent an offer for this AMC");
    const { error } = await context.supabase.from("amc_offers").insert({
      amc_request_id: data.requestId, technician_id: technician.id, price: data.price,
      coverage_details: data.coverageDetails, terms: data.terms || null,
    });
    if (error) throw new Error(`Failed to send AMC offer: ${error.message}`);
    const { error: messageError } = await context.supabase.from("amc_messages").insert({
      amc_request_id: data.requestId, technician_id: technician.id, sender_id: context.userId,
      sender_role: "technician", body: `AMC offer: ₹${data.price.toFixed(2)} — ${data.coverageDetails}`,
    });
    if (messageError) throw new Error(`Offer saved, but message failed: ${messageError.message}`);
    return { ok: true };
  });

export const selectAmcOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid(), offerId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request } = await context.supabase.from("amc_requests").select("customer_id, status").eq("id", data.requestId).maybeSingle();
    if (!request || request.customer_id !== context.userId) throw new Error("You can only select an offer on your AMC request");
    if (request.status !== "open") throw new Error("An offer has already been selected");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: offer } = await supabaseAdmin.from("amc_offers").select("id, technician_id").eq("id", data.offerId).eq("amc_request_id", data.requestId).maybeSingle();
    if (!offer) throw new Error("AMC offer not found");
    const { error } = await supabaseAdmin.from("amc_requests").update({ selected_offer_id: offer.id, status: "selected" }).eq("id", data.requestId).eq("status", "open");
    if (error) throw new Error(`Failed to select offer: ${error.message}`);
    await supabaseAdmin.from("amc_offers").update({ status: "rejected" }).eq("amc_request_id", data.requestId).neq("id", offer.id);
    await supabaseAdmin.from("amc_offers").update({ status: "selected" }).eq("id", offer.id);
    return { ok: true };
  });

export const payAndActivateAmc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request } = await context.supabase.from("amc_requests").select("id, customer_id, asset_id, requested_days, selected_offer_id, status").eq("id", data.requestId).maybeSingle();
    if (!request || request.customer_id !== context.userId) throw new Error("You can only pay for your AMC request");
    if (request.status === "active") return { ok: true };
    if (request.status !== "selected" || !request.selected_offer_id) throw new Error("Select a technician offer first");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: offer } = await supabaseAdmin.from("amc_offers").select("id, technician_id, price").eq("id", request.selected_offer_id).maybeSingle();
    if (!offer) throw new Error("Selected offer not found");
    const now = new Date();
    const ends = new Date(now);
    ends.setUTCDate(ends.getUTCDate() + request.requested_days);
    const { error } = await supabaseAdmin.from("amc_contracts").insert({
      amc_request_id: request.id, offer_id: offer.id, customer_id: context.userId,
      asset_id: request.asset_id, technician_id: offer.technician_id, duration_days: request.requested_days,
      price: offer.price, starts_at: now.toISOString(), ends_at: ends.toISOString(), paid_at: now.toISOString(), status: "active",
    });
    if (error) {
      if (error.code === "23505") throw new Error("This asset already has an active AMC");
      throw new Error(`Failed to activate AMC: ${error.message}`);
    }
    await supabaseAdmin.from("amc_requests").update({ status: "active" }).eq("id", request.id);
    await supabaseAdmin.from("amc_offers").update({ status: "paid", paid_at: now.toISOString() }).eq("id", offer.id);
    return { ok: true };
  });

export const cancelAmc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ contractId: z.string().uuid(), reason: z.string().trim().max(500).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: contract } = await context.supabase.from("amc_contracts").select("id, customer_id, amc_request_id, status").eq("id", data.contractId).maybeSingle();
    if (!contract || contract.customer_id !== context.userId) throw new Error("You can only cancel your own AMC");
    if (contract.status !== "active") return { ok: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("amc_contracts").update({ status: "cancelled", cancelled_at: now, cancellation_reason: data.reason || null }).eq("id", contract.id).eq("status", "active");
    if (error) throw new Error(`Failed to cancel AMC: ${error.message}`);
    await supabaseAdmin.from("amc_requests").update({ status: "cancelled" }).eq("id", contract.amc_request_id);
    return { ok: true };
  });
