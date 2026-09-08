import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  description: z.string().min(1).max(200),
  hsn: z.string().max(20).optional().default(""),
  quantity: z.number().min(0).max(100000),
  rate: z.number().min(0).max(10000000),
  taxRate: z.number().min(0).max(28),
});

export type BillItem = z.infer<typeof itemSchema>;

const billSchema = z.object({
  requestId: z.string().uuid(),
  billNumber: z.string().min(1).max(50),
  billDate: z.string().min(4).max(20),
  firmName: z.string().min(2).max(150),
  firmAddress: z.string().max(400).optional().default(""),
  firmGstin: z.string().max(20).optional().default(""),
  firmPhone: z.string().max(20).optional().default(""),
  firmEmail: z.string().max(120).optional().default(""),
  placeOfSupply: z.string().max(100).optional().default(""),
  customerName: z.string().max(150).optional().default(""),
  customerAddress: z.string().max(400).optional().default(""),
  customerGstin: z.string().max(20).optional().default(""),
  taxMode: z.enum(["cgst_sgst", "igst", "none"]),
  notes: z.string().max(600).optional().default(""),
  items: z.array(itemSchema).min(1).max(30),
});

function totals(items: BillItem[], taxMode: string) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  const taxAmount =
    taxMode === "none" ? 0 : items.reduce((sum, i) => sum + (i.quantity * i.rate * i.taxRate) / 100, 0);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  };
}

/** Bill + prefill data for a repair request (technician or customer). */
export const getBillContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: request } = await context.supabase
      .from("repair_requests")
      .select("id, customer_id, brand, model, issue_description, address, city, state, pincode, categories (name)")
      .eq("id", data.requestId)
      .maybeSingle();

    const { data: invoice } = await context.supabase
      .from("invoices")
      .select("id, amount, status, technician_id, repair_notes, parts_replaced")
      .eq("repair_request_id", data.requestId)
      .maybeSingle();

    const { data: bill } = await context.supabase
      .from("gst_bills")
      .select("*")
      .eq("repair_request_id", data.requestId)
      .maybeSingle();

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("user_id", context.userId)
      .maybeSingle();

    let technician: any = null;
    if (profile) {
      const { data: tech } = await context.supabase
        .from("technicians")
        .select("id, business_name, display_name, gst_number, address, city, state, pincode, contact_phone, contact_email")
        .eq("profile_id", profile.id)
        .maybeSingle();
      technician = tech ?? null;
    }

    const isTechnician = !!technician && !!invoice && invoice.technician_id === technician.id;
    const isCustomer = request?.customer_id === context.userId;

    let customerName: string | null = null;
    if (isTechnician && request) {
      const { data: customerProfile } = await context.supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", request.customer_id)
        .maybeSingle();
      customerName = customerProfile?.full_name ?? null;
    }

    return {
      request,
      invoice,
      bill,
      isTechnician,
      isCustomer,
      canCreate: isTechnician && invoice?.status === "paid",
      prefill: isTechnician
        ? {
            firmName: technician.business_name || technician.display_name || profile?.full_name || "",
            firmAddress: [technician.address, technician.city, technician.state, technician.pincode]
              .filter(Boolean)
              .join(", "),
            firmGstin: technician.gst_number || "",
            firmPhone: technician.contact_phone || profile?.phone || "",
            firmEmail: technician.contact_email || "",
            placeOfSupply: technician.state || request?.state || "",
            customerName: customerName ?? "",
            customerAddress: [request?.address, request?.city, request?.state, request?.pincode]
              .filter(Boolean)
              .join(", "),
          }
        : null,
    };
  });

/** Technician creates or updates the GST bill for a paid repair. */
export const saveGstBill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => billSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) throw new Error("Profile not found");

    const { data: technician } = await context.supabase
      .from("technicians")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (!technician) throw new Error("Only the assigned technician can create this bill");

    const { data: invoice } = await context.supabase
      .from("invoices")
      .select("id, status, technician_id, customer_id")
      .eq("repair_request_id", data.requestId)
      .maybeSingle();
    if (!invoice || invoice.technician_id !== technician.id) {
      throw new Error("Only the assigned technician can create this bill");
    }
    if (invoice.status !== "paid") throw new Error("The customer must approve and pay before billing");

    const sums = totals(data.items, data.taxMode);

    const { data: saved, error } = await context.supabase
      .from("gst_bills")
      .upsert(
        {
          repair_request_id: data.requestId,
          invoice_id: invoice.id,
          technician_id: technician.id,
          customer_id: invoice.customer_id,
          bill_number: data.billNumber,
          bill_date: data.billDate,
          firm_name: data.firmName,
          firm_address: data.firmAddress || null,
          firm_gstin: data.firmGstin || null,
          firm_phone: data.firmPhone || null,
          firm_email: data.firmEmail || null,
          place_of_supply: data.placeOfSupply || null,
          customer_name: data.customerName || null,
          customer_address: data.customerAddress || null,
          customer_gstin: data.customerGstin || null,
          items: data.items,
          tax_mode: data.taxMode,
          notes: data.notes || null,
          subtotal: sums.subtotal,
          tax_amount: sums.taxAmount,
          total: sums.total,
        },
        { onConflict: "repair_request_id" }
      )
      .select("*")
      .maybeSingle();

    if (error) throw new Error(`Failed to save bill: ${error.message}`);
    return saved;
  });

/** Records the uploaded PDF path on the bill. */
export const attachBillPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ billId: z.string().uuid(), pdfPath: z.string().min(3).max(300) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("gst_bills")
      .update({ pdf_path: data.pdfPath })
      .eq("id", data.billId);
    if (error) throw new Error(`Failed to attach the PDF: ${error.message}`);
    return { ok: true };
  });

/** Signed download link for the bill PDF (technician or customer). */
export const getBillPdfUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: bill } = await context.supabase
      .from("gst_bills")
      .select("id, pdf_path")
      .eq("repair_request_id", data.requestId)
      .maybeSingle();

    if (!bill?.pdf_path) return { url: null as string | null };

    const { data: signed, error } = await context.supabase.storage
      .from("gst-bills")
      .createSignedUrl(bill.pdf_path, 60 * 10);

    if (error) throw new Error(`Failed to prepare the download: ${error.message}`);
    return { url: signed?.signedUrl ?? null };
  });
