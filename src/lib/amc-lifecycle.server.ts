import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function processAmcLifecycle() {
  const now = new Date().toISOString();
  const { data: expiring } = await supabaseAdmin.from("amc_contracts")
    .select("id, customer_id, amc_request_id, ends_at, reminder_7d_sent_at")
    .eq("status", "active")
    .lte("ends_at", new Date(Date.now() + 7 * 86400000).toISOString());

  for (const contract of expiring ?? []) {
    if (contract.ends_at <= now) {
      await supabaseAdmin.from("amc_contracts").update({ status: "expired" }).eq("id", contract.id).eq("status", "active");
      await supabaseAdmin.from("amc_requests").update({ status: "expired" }).eq("id", contract.amc_request_id);
      await supabaseAdmin.from("notifications").insert({
        user_id: contract.customer_id, type: "amc_expired", title: "Your AMC has expired",
        body: "Reactivate your AMC to keep direct technician coverage for this asset.",
        data: { amc_request_id: contract.amc_request_id },
      });
    } else if (!contract.reminder_7d_sent_at) {
      await supabaseAdmin.from("notifications").insert({
        user_id: contract.customer_id, type: "amc_expiry_reminder", title: "Your AMC expires soon",
        body: `Your AMC ends on ${new Date(contract.ends_at).toLocaleDateString("en-IN")}. Reactivate it to continue coverage.`,
        data: { amc_request_id: contract.amc_request_id },
      });
      await supabaseAdmin.from("amc_contracts").update({ reminder_7d_sent_at: now }).eq("id", contract.id);
    }
  }
}