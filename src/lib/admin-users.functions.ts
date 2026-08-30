import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!isAdmin) throw new Error("Admin access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: true });
    if (error) throw new Error(`Failed to load admins: ${error.message}`);

    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw new Error("Failed to load user accounts");
    const emailById = new Map(usersData.users.map((u) => [u.id, u.email ?? ""]));

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", (roles ?? []).map((r) => r.user_id));
    const nameById = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name ?? ""]));

    return (roles ?? []).map((r) => ({
      userId: r.user_id,
      email: emailById.get(r.user_id) ?? "Unknown account",
      fullName: nameById.get(r.user_id) ?? "",
      since: r.created_at,
      isSelf: r.user_id === context.userId,
    }));
  });

export const grantAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ email: z.string().email().max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!isAdmin) throw new Error("Admin access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw new Error("Failed to look up user accounts");
    const target = usersData.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (!target) throw new Error("No account exists with that email. Ask them to sign up first.");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: target.id, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(`Could not grant admin: ${error.message}`);

    return { ok: true, email: target.email ?? email };
  });

export const revokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!isAdmin) throw new Error("Admin access required");

    if (data.userId === context.userId) {
      throw new Error("You cannot remove your own admin access.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(`Could not revoke admin: ${error.message}`);

    return { ok: true };
  });
