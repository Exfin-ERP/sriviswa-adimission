import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsers, setUserRole, setCampusScope } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLE_LABEL, STAFF_ROLES } from "@/lib/roles";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({ meta: [{ title: "Users & Roles — Sri Viswa Admissions" }] }),
  component: UsersAdmin,
});

function UsersAdmin() {
  const call = useServerFn(listUsers);
  const rolefn = useServerFn(setUserRole);
  const scopefn = useServerFn(setCampusScope);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => call({ data: {} } as any) });
  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => (await supabase.from("campuses").select("id,name,code").order("name")).data ?? [],
  });

  async function toggleRole(user_id: string, role: string, has: boolean) {
    try { await rolefn({ data: { user_id, role, grant: !has } } as any); qc.invalidateQueries({ queryKey: ["users"] }); }
    catch (e: any) { toast.error(e.message); }
  }
  async function toggleScope(user_id: string, campus_id: string, has: boolean) {
    try { await scopefn({ data: { user_id, campus_id, grant: !has } } as any); qc.invalidateQueries({ queryKey: ["users"] }); }
    catch (e: any) { toast.error(e.message); }
  }

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const rolesByUser = new Map<string, string[]>();
  for (const r of data.roles) {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role); rolesByUser.set(r.user_id, arr);
  }
  const scopesByUser = new Map<string, string[]>();
  for (const s of data.scopes) {
    const arr = scopesByUser.get(s.user_id) ?? [];
    arr.push(s.campus_id); scopesByUser.set(s.user_id, arr);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">Grant roles and assign campus scopes.</p>
      </div>
      <Card><CardContent className="p-0"><Table>
        <TableHeader><TableRow>
          <TableHead>User</TableHead>
          <TableHead>Roles</TableHead>
          <TableHead>Campus scopes</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {data.users.map((u: any) => {
            const userRoles = rolesByUser.get(u.id) ?? [];
            const userScopes = scopesByUser.get(u.id) ?? [];
            return (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="text-sm font-medium">{u.email}</div>
                  <div className="text-xs text-muted-foreground">{u.id.slice(0, 8)}…</div>
                </TableCell>
                <TableCell>
                  <Popover><PopoverTrigger asChild>
                    <Button size="sm" variant="outline">{userRoles.length} role{userRoles.length !== 1 ? "s" : ""}</Button>
                  </PopoverTrigger><PopoverContent align="start" className="w-64">
                    <div className="space-y-2">
                      {STAFF_ROLES.map((r) => {
                        const has = userRoles.includes(r);
                        return (
                          <label key={r} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={has} onCheckedChange={() => toggleRole(u.id, r, has)} />
                            {ROLE_LABEL[r]}
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent></Popover>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {userRoles.map((r) => <span key={r} className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary">{(ROLE_LABEL as Record<string, string>)[r] ?? r}</span>)}
                  </div>
                </TableCell>
                <TableCell>
                  <Popover><PopoverTrigger asChild>
                    <Button size="sm" variant="outline">{userScopes.length} campus{userScopes.length !== 1 ? "es" : ""}</Button>
                  </PopoverTrigger><PopoverContent align="start" className="w-64">
                    <div className="max-h-72 space-y-2 overflow-auto">
                      {(campuses ?? []).map((c: any) => {
                        const has = userScopes.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center gap-2 text-sm">
                            <Checkbox checked={has} onCheckedChange={() => toggleScope(u.id, c.id, has)} />
                            {c.name}
                          </label>
                        );
                      })}
                    </div>
                  </PopoverContent></Popover>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table></CardContent></Card>
    </div>
  );
}
