import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogs } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit Log — Sri Viswa Admissions" }] }),
  component: Audit,
});

function Audit() {
  const call = useServerFn(listAuditLogs);
  const { data, isLoading } = useQuery({ queryKey: ["audit"], queryFn: () => call({ data: { limit: 300 } } as any) });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Recent sensitive actions across the portal.</p>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Meta</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>}
            {(data?.rows ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">{r.actor_id?.slice(0, 8) ?? "—"}</TableCell>
                <TableCell className="font-medium">{r.action}</TableCell>
                <TableCell className="text-xs">{r.entity} · {r.entity_id?.slice(0, 8)}</TableCell>
                <TableCell className="max-w-md truncate font-mono text-xs text-muted-foreground">{r.meta ? JSON.stringify(r.meta) : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
