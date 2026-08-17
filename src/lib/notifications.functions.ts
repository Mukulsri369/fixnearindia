import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("id, type, title, body, read, data, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw new Error(`Failed to load notifications: ${error.message}`);
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ ids: z.array(z.string().uuid()).optional() }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    let query = context.supabase.from("notifications").update({ read: true }).eq("user_id", context.userId);
    if (data.ids?.length) query = query.in("id", data.ids);
    else query = query.eq("read", false);

    const { error } = await query;
    if (error) throw new Error(`Failed to update notifications: ${error.message}`);
    return { ok: true };
  });
