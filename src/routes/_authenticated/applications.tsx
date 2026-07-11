import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listApplications } from "@/lib/applications.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { APPLICATION_STATUSES, INSTITUTION_TYPES, STATUS_LABEL, type ApplicationStatus } from "@/lib/roles";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "Applications — Sri Viswa Admissions" }] }),
  component: ApplicationsList,
});

function ApplicationsList() {
  const [status, setStatus] = useState<string>("all");
  const [inst, setInst] = useState<string>("all");
  const [campus, setCampus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const call = useServerFn(listApplications);

  const { data: campuses } = useQuery({
    queryKey: ["campuses"],
    queryFn: async () => (await supabase.from("campuses").select("id,name,code").order("name")).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["apps", status, inst, campus, search],
    queryFn: () => call({
      data: {
        status: status === "all" ? undefined : status,
        institution_type: inst === "all" ? undefined : inst,
        campus_id: campus === "all" ? undefined : campus,
        search: search.trim() || undefined,
        limit: 100,
      },
    } as any),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} total</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input placeholder="Search application number…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={inst} onValueChange={setInst}>
              <SelectTrigger><SelectValue placeholder="Institution" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutions</SelectItem>
                {INSTITUTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={campus} onValueChange={setCampus}>
              <SelectTrigger><SelectValue placeholder="Campus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campuses</SelectItem>
                {(campuses ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App #</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Hostel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              {!isLoading && (data?.rows ?? []).length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No applications match your filters.</TableCell></TableRow>
              )}
              {(data?.rows ?? []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-semibold">{r.application_number}</TableCell>
                  <TableCell className="capitalize">{r.institution_type}</TableCell>
                  <TableCell>{r.campuses?.name ?? "—"}</TableCell>
                  <TableCell>{r.programs?.name ?? "—"}</TableCell>
                  <TableCell>{r.hostel_required ? "Yes" : "No"}</TableCell>
                  <TableCell><StatusBadge status={r.status as ApplicationStatus} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>
                    <Link to="/applications/$id" params={{ id: r.id }} className="inline-flex items-center gap-1 text-primary hover:underline">
                      Open <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
