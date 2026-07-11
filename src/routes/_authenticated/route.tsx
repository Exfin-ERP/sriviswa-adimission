import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { myRoles, claimFirstSuperAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const [roles, setRoles] = useState<string[] | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // First-ever user can claim Super Admin
        await claimFirstSuperAdmin();
      } catch {
        /* ignore */
      }
      try {
        const { roles } = await myRoles();
        if (mounted) setRoles(roles);
      } catch {
        if (mounted) setRoles([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (roles === null) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  return (
    <AppShell roles={roles}>
      <Outlet />
    </AppShell>
  );
}
