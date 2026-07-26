import { supabase } from "../lib/supabaseClient.js";
import { getTechnicianByUser } from "./technicians.js";

const REQUEST_LIST_SELECT = `
  id, brand, model, issue_description, status, priority, city, pincode,
  preferred_visit_time, created_at, updated_at, category_id,
  categories (id, name),
  request_assignments (id, status, technicians (id, profiles (full_name, phone)))
`;

const REQUEST_DETAIL_SELECT = `
  id, brand, model, issue_description, status, priority, city, state, pincode,
  address, preferred_visit_time, created_at, updated_at, customer_id, category_id,
  categories (id, name),
  repair_request_images (id, url, sort_order),
  request_assignments (
    id, status, accepted_at, completed_at, created_at,
    technicians (id, business_name, experience_years, service_radius_km, city,
                 avg_rating, profiles (full_name, phone))
  )
`;

export async function createRepairRequest(userId, values) {
  const { data, error } = await supabase
    .from("repair_requests")
    .insert({
      customer_id: userId,
      category_id: values.categoryId,
      brand: values.brand || null,
      model: values.model || null,
      issue_description: values.issueDescription,
      address: values.address || null,
      city: values.city,
      state: values.state || null,
      pincode: values.pincode,
      preferred_visit_time: values.preferredVisitTime || null,
      priority: values.priority ?? "medium",
      status: "open",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create request: ${error.message}`);
  return data;
}

export async function listMyRequests(userId) {
  const { data, error } = await supabase
    .from("repair_requests")
    .select(REQUEST_LIST_SELECT)
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load requests: ${error.message}`);
  return data ?? [];
}

export async function getRepairRequest(requestId) {
  const { data, error } = await supabase
    .from("repair_requests")
    .select(REQUEST_DETAIL_SELECT)
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load request: ${error.message}`);
  if (!data) throw new Error("Repair request not found");
  return data;
}

export async function updateRequestStatus(requestId, status) {
  const { error } = await supabase
    .from("repair_requests")
    .update({ status })
    .eq("id", requestId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Uploads one image to the repair-images bucket and records its public URL. */
export async function uploadRequestImage(requestId, file, sortOrder = 0) {
  const ext = file.name.split(".").pop();
  const path = `${requestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("repair-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("repair-images").getPublicUrl(path);

  const { error: insertError } = await supabase.from("repair_request_images").insert({
    repair_request_id: requestId,
    url: publicUrl,
    sort_order: sortOrder,
  });

  if (insertError) throw new Error(`Failed to save image: ${insertError.message}`);
  return publicUrl;
}

export async function uploadRequestImages(requestId, files) {
  const urls = [];
  for (let i = 0; i < files.length; i += 1) {
    urls.push(await uploadRequestImage(requestId, files[i], i));
  }
  return urls;
}

/** Customer invites a technician to a request. */
export async function requestAssignment(requestId, technicianId) {
  const { data: existing } = await supabase
    .from("request_assignments")
    .select("id, status")
    .eq("repair_request_id", requestId)
    .eq("technician_id", technicianId)
    .maybeSingle();

  if (existing && existing.status !== "rejected") {
    throw new Error("You already invited this technician.");
  }

  if (existing) {
    const { error } = await supabase
      .from("request_assignments")
      .update({ status: "pending", accepted_at: null, completed_at: null })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return existing;
  }

  const { data, error } = await supabase
    .from("request_assignments")
    .insert({
      repair_request_id: requestId,
      technician_id: technicianId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to invite technician: ${error.message}`);
  return data;
}

/** Jobs offered to / handled by the signed-in technician. */
export async function listTechnicianAssignments(userId) {
  const technician = await getTechnicianByUser(userId);
  if (!technician) throw new Error("You are not registered as a technician.");

  const { data, error } = await supabase
    .from("request_assignments")
    .select(
      `id, status, accepted_at, completed_at, created_at,
       repair_requests (
         id, brand, model, issue_description, priority, city, pincode, address,
         preferred_visit_time, status, created_at,
         categories (name)
       )`,
    )
    .eq("technician_id", technician.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load assignments: ${error.message}`);
  return { technician, assignments: data ?? [] };
}

/** Technician accepts / declines / completes a job; keeps the request status in sync. */
export async function updateAssignmentStatus(assignmentId, status) {
  const updates = { status };
  if (status === "accepted") updates.accepted_at = new Date().toISOString();
  if (status === "completed") updates.completed_at = new Date().toISOString();
  if (status === "rejected") updates.accepted_at = null;

  const { data: assignment, error } = await supabase
    .from("request_assignments")
    .update(updates)
    .eq("id", assignmentId)
    .select("id, repair_request_id")
    .single();

  if (error) throw new Error(`Failed to update job: ${error.message}`);

  const requestStatus =
    status === "accepted" ? "assigned" : status === "completed" ? "completed" : "open";

  await updateRequestStatus(assignment.repair_request_id, requestStatus);
  return assignment;
}

export async function createReview({ assignmentId, reviewerId, revieweeId, rating, comment }) {
  const { error } = await supabase.from("reviews").insert({
    assignment_id: assignmentId,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    rating,
    comment: comment || null,
  });
  if (error) throw new Error(`Failed to submit review: ${error.message}`);
  return { ok: true };
}
