import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const createRepairRequestSchema = z.object({
  title: z.string().min(5).max(120),
  issueDescription: z.string().min(20).max(2000),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  categoryId: z.string().uuid(),
  pincode: z.string().min(6).max(10),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  preferredVisitTime: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export const createRepairRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createRepairRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error } = await context.supabase
      .from("repair_requests")
      .insert({
        customer_id: context.userId,
        brand: data.brand,
        model: data.model,
        category_id: data.categoryId,
        pincode: data.pincode,
        city: data.city,
        state: data.state,
        address: data.address,
        issue_description: data.issueDescription,
        preferred_visit_time: data.preferredVisitTime,
        priority: data.priority,
        status: "open",
      })
      .select("id")
      .single();

    if (error || !request) {
      throw new Error(`Failed to create repair request: ${error?.message ?? "unknown"}`);
    }

    return { requestId: request.id };
  });

export const getMyRepairRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("repair_requests")
      .select(
        `id, brand, model, issue_description, status, priority, city, pincode, preferred_visit_time, created_at, updated_at,
        categories (name),
        request_assignments (id, status, technicians (id, profiles (full_name)))`
      )
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load requests: ${error.message}`);
    }

    return data ?? [];
  });

export const getRepairRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error } = await context.supabase
      .from("repair_requests")
      .select(
        `id, brand, model, issue_description, status, priority, city, pincode, address, state, preferred_visit_time, created_at, updated_at, customer_id,
        categories (name),
        request_assignments (id, status, accepted_at, completed_at, technicians (id, experience_years, service_radius_km, profiles (full_name, phone)))`
      )
      .eq("id", data.requestId)
      .single();

    if (error || !request) {
      throw new Error("Repair request not found");
    }

    return request;
  });

export const findMatchingTechnicians = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error: requestError } = await context.supabase
      .from("repair_requests")
      .select("category_id, pincode, city, customer_id, status")
      .eq("id", data.requestId)
      .single();

    if (requestError || !request) {
      throw new Error("Repair request not found");
    }

    if (request.customer_id !== context.userId) {
      throw new Error("You can only match technicians for your own requests");
    }

    if (request.status !== "open") {
      throw new Error("This request is no longer open for matching");
    }

    if (!request.pincode || !request.city || !request.category_id) {
      throw new Error("Request location or category is missing");
    }

    const { data: technicians, error } = await context.supabase
      .from("technicians")
      .select(
        `id, experience_years, service_radius_km, pincode, city, is_approved, is_available, profiles (full_name, phone, avatar_url),
        technician_categories!inner (category_id)`
      )
      .eq("is_approved", true)
      .eq("is_available", true)
      .eq("technician_categories.category_id", request.category_id)
      .or(`city.eq.${request.city},pincode.like.${request.pincode.slice(0, 3)}%`);

    if (error) {
      throw new Error(`Failed to find technicians: ${error.message}`);
    }

    return technicians ?? [];
  });

export const requestAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid(), technicianId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error: requestError } = await context.supabase
      .from("repair_requests")
      .select("customer_id, status")
      .eq("id", data.requestId)
      .single();

    if (requestError || !request) {
      throw new Error("Repair request not found");
    }

    if (request.customer_id !== context.userId) {
      throw new Error("You can only request assignments for your own requests");
    }

    if (request.status !== "open") {
      throw new Error("This request is no longer open");
    }

    const { data: existing, error: existingError } = await context.supabase
      .from("request_assignments")
      .select("id, status")
      .eq("repair_request_id", data.requestId)
      .eq("technician_id", data.technicianId)
      .maybeSingle();

    if (existingError) {
      throw new Error("Failed to check existing assignment");
    }

    if (existing && existing.status !== "rejected") {
      throw new Error("An assignment already exists for this technician");
    }

    const { data: assignment, error } = await context.supabase
      .from("request_assignments")
      .insert({
        repair_request_id: data.requestId,
        technician_id: data.technicianId,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !assignment) {
      throw new Error(`Failed to request assignment: ${error?.message ?? "unknown"}`);
    }

    return { assignmentId: assignment.id };
  });

export const getTechnicianAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!profile) return { isTechnician: false, assignments: [] };

    const { data: technician } = await context.supabase
      .from("technicians")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!technician) return { isTechnician: false, assignments: [] };

    const { data, error } = await context.supabase
      .from("request_assignments")
      .select(
        `id, status, accepted_at, completed_at, created_at,
        repair_requests (id, brand, model, issue_description, priority, city, pincode, address, preferred_visit_time, status, categories (name), profiles (full_name, phone))`
      )
      .eq("technician_id", technician.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load assignments: ${error.message}`);
    }

    return { isTechnician: true, assignments: data ?? [] };
  });


export const updateAssignmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ assignmentId: z.string().uuid(), status: z.enum(["accepted", "rejected", "completed"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: technician, error: techError } = await context.supabase
      .from("technicians")
      .select("id")
      .eq("profile_id", context.userId)
      .single();

    if (techError || !technician) {
      throw new Error("You are not registered as a technician");
    }

    const { data: assignment, error: assignmentError } = await context.supabase
      .from("request_assignments")
      .select("id, technician_id, repair_request_id, status")
      .eq("id", data.assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.technician_id !== technician.id) {
      throw new Error("You can only manage your own assignments");
    }

    const updates: { status: string; accepted_at?: string | null; completed_at?: string | null } = { status: data.status };
    if (data.status === "accepted") {
      updates.accepted_at = new Date().toISOString();
    }
    if (data.status === "completed") {
      updates.completed_at = new Date().toISOString();
    }
    if (data.status === "rejected") {
      updates.accepted_at = null;
    }

    const { error } = await context.supabase
      .from("request_assignments")
      .update(updates)
      .eq("id", data.assignmentId);

    if (error) {
      throw new Error(`Failed to update assignment: ${error.message}`);
    }

    if (data.status === "accepted") {
      await context.supabase.from("repair_requests").update({ status: "assigned" }).eq("id", assignment.repair_request_id);
    } else if (data.status === "completed") {
      await context.supabase.from("repair_requests").update({ status: "completed" }).eq("id", assignment.repair_request_id);
    } else if (data.status === "rejected") {
      await context.supabase.from("repair_requests").update({ status: "open" }).eq("id", assignment.repair_request_id);
    }

    return { ok: true };
  });

const uploadImageSchema = z.object({
  requestId: z.string().uuid(),
  base64Image: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export const uploadRepairImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => uploadImageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: request, error: requestError } = await context.supabase
      .from("repair_requests")
      .select("customer_id")
      .eq("id", data.requestId)
      .single();

    if (requestError || !request) {
      throw new Error("Repair request not found");
    }

    if (request.customer_id !== context.userId) {
      throw new Error("You can only upload images to your own requests");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base64 = data.base64Image.split(",")[1];
    if (!base64) throw new Error("Invalid image data");
    const buffer = Buffer.from(base64, "base64");
    const path = `${data.requestId}/${Date.now()}_${data.fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage.from("repair-images").upload(path, buffer, {
      contentType: data.contentType,
      upsert: false,
    });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: publicUrl } = supabaseAdmin.storage.from("repair-images").getPublicUrl(path);

    const { error: insertError } = await context.supabase.from("repair_request_images").insert({
      repair_request_id: data.requestId,
      url: publicUrl.publicUrl,
    });

    if (insertError) {
      throw new Error(`Failed to save image record: ${insertError.message}`);
    }

    return { url: publicUrl.publicUrl };
  });
