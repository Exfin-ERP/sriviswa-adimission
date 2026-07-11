import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function actorRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}
function isAdmin(roles: string[]) { return roles.some((r) => ["super_admin", "admin"].includes(r)); }

/* -------- LIST USERS + ROLES (Super Admin / Admin only) -------- */
export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const roles = await actorRoles(supabase, userId);
    if (!isAdmin(roles)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usersData, error: e1 } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (e1) throw new Error(e1.message);
    const users = usersData.users.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, phone: u.phone }));
    const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: scopes } = await supabaseAdmin.from("user_campus_scopes").select("user_id, campus_id");
    return { users, roles: roleRows ?? [], scopes: scopes ?? [] };
  });

/* -------- ASSIGN / REMOVE ROLE -------- */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; role: string; grant: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const roles = await actorRoles(supabase, userId);
    if (!isAdmin(roles)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: data.user_id, role: data.role as any }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id).eq("role", data.role as any);
    }
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId, action: data.grant ? "role.grant" : "role.revoke", entity: "user", entity_id: data.user_id, meta: { role: data.role },
    });
    return { ok: true };
  });

/* -------- ASSIGN CAMPUS SCOPE -------- */
export const setCampusScope = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; campus_id: string; grant: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const roles = await actorRoles(supabase, userId);
    if (!isAdmin(roles)) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      await supabaseAdmin.from("user_campus_scopes").upsert({ user_id: data.user_id, campus_id: data.campus_id }, { onConflict: "user_id,campus_id" });
    } else {
      await supabaseAdmin.from("user_campus_scopes").delete().eq("user_id", data.user_id).eq("campus_id", data.campus_id);
    }
    return { ok: true };
  });

/* -------- MY ROLES (used by client) -------- */
export const myRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await actorRoles(context.supabase, context.userId);
    return { roles };
  });

/* -------- AUDIT LOG (Admin) -------- */
export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const roles = await actorRoles(supabase, userId);
    if (!isAdmin(roles) && !roles.includes("head_office")) throw new Error("Forbidden");
    const { data: rows, error } = await supabase.from("audit_logs").select("*")
      .order("created_at", { ascending: false }).limit(Math.min(data.limit ?? 100, 500));
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

/* -------- BOOTSTRAP FIRST SUPER ADMIN -------- */
/** If there are no super_admins yet, the caller becomes super_admin. */
export const claimFirstSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "super_admin");
    if ((count ?? 0) > 0) return { claimed: false };
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "super_admin" });
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: userId, action: "role.bootstrap_super_admin", entity: "user", entity_id: userId,
    });
    return { claimed: true };
  });
