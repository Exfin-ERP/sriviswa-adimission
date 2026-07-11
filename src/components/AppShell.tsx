import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, Users, Database, ScrollText, LogOut, Menu, X, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/master-data", label: "Master Data", icon: Database },
  { to: "/users", label: "Users & Roles", icon: Users },
  { to: "/audit", label: "Audit Log", icon: ScrollText },
] as const;

export function AppShell({ children, roles }: { children: ReactNode; roles: string[] }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string>("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const isAdmin = roles.includes("super_admin") || roles.includes("admin");
  const items = NAV.filter((n) => {
    if (n.to === "/users" || n.to === "/master-data" || n.to === "/audit") return isAdmin || roles.includes("head_office");
    return true;
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Logo size={36} />
          <button className="text-sidebar-foreground/70 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-sidebar-border p-3">
          <div className="mb-2 truncate text-xs text-sidebar-foreground/70">{email}</div>
          <div className="mb-2 flex flex-wrap gap-1">
            {roles.length === 0 && (
              <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] text-warning-foreground">No role assigned</span>
            )}
            {roles.map((r) => (
              <span key={r} className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px]">{r}</span>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5" /> Applicant view
          </Link>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
    </div>
  );
}
