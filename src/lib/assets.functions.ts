import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const assetSchema = z.object({
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().uuid(),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  serialNumber: z.string().trim().max(120).optional(),
  purchaseDate: z.string().date().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const getMyAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("customer_assets")
      .select("id, name, category_id, brand, model, serial_number, purchase_date, notes, created_at, categories (name)")
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to load assets: ${error.message}`);
    return data ?? [];
  });

export const createCustomerAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => assetSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: asset, error } = await context.supabase
      .from("customer_assets")
      .insert({
        customer_id: context.userId,
        name: data.name,
        category_id: data.categoryId,
        brand: data.brand || null,
        model: data.model || null,
        serial_number: data.serialNumber || null,
        purchase_date: data.purchaseDate || null,
        notes: data.notes || null,
      })
      .select("id")
      .single();

    if (error || !asset) throw new Error(`Failed to add asset: ${error?.message ?? "unknown"}`);
    return asset;
  });

export const updateCustomerAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => assetSchema.extend({ assetId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("customer_assets")
      .update({
        name: data.name,
        category_id: data.categoryId,
        brand: data.brand || null,
        model: data.model || null,
        serial_number: data.serialNumber || null,
        purchase_date: data.purchaseDate || null,
        notes: data.notes || null,
      })
      .eq("id", data.assetId)
      .eq("customer_id", context.userId);

    if (error) throw new Error(`Failed to update asset: ${error.message}`);
    return { ok: true };
  });

export const deleteCustomerAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ assetId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("customer_assets")
      .delete()
      .eq("id", data.assetId)
      .eq("customer_id", context.userId);

    if (error) {
      if (error.code === "23503") throw new Error("This asset is linked to a repair request and cannot be removed.");
      throw new Error(`Failed to remove asset: ${error.message}`);
    }
    return { ok: true };
  });