import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/master-data")({
  head: () => ({ meta: [{ title: "Master Data — Sri Viswa Admissions" }] }),
  component: MasterData,
});

function MasterData() {
  const q = <T,>(k: string, fn: () => Promise<T>) => useQuery({ queryKey: [k], queryFn: fn });
  const campuses = q("md-campuses", async () => (await supabase.from("campuses").select("*").order("name")).data ?? []);
  const programs = q("md-programs", async () => (await supabase.from("programs").select("*, campuses(name)").order("name")).data ?? []);
  const hostels  = q("md-hostels", async () => (await supabase.from("hostels").select("*, campuses(name)").order("name")).data ?? []);
  const docs     = q("md-docs", async () => (await supabase.from("document_definitions").select("*").order("institution_type")).data ?? []);
  const years    = q("md-ay", async () => (await supabase.from("academic_years").select("*").order("code")).data ?? []);
  const quotas   = q("md-quotas", async () => (await supabase.from("quotas").select("*").order("code")).data ?? []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
        <p className="text-sm text-muted-foreground">Campuses, programs, hostels, document requirements and system reference data.</p>
      </div>
      <Tabs defaultValue="campuses">
        <TabsList>
          <TabsTrigger value="campuses">Campuses</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="hostels">Hostels</TabsTrigger>
          <TabsTrigger value="docs">Document Definitions</TabsTrigger>
          <TabsTrigger value="years">Academic Years</TabsTrigger>
          <TabsTrigger value="quotas">Quotas</TabsTrigger>
        </TabsList>
        <TabsContent value="campuses">
          <Card><CardContent className="p-0"><Table><TableHeader><TableRow>
            <TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>City</TableHead><TableHead>Types</TableHead>
          </TableRow></TableHeader><TableBody>
            {(campuses.data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.city}</TableCell>
                <TableCell><div className="flex flex-wrap gap-1">{(r.supported_types ?? []).map((t: string) => <span key={t} className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary">{t}</span>)}</div></TableCell>
              </TableRow>
            ))}
          </TableBody></Table></CardContent></Card>
        </TabsContent>
        <TabsContent value="programs">
          <Card><CardContent className="p-0"><Table><TableHeader><TableRow>
            <TableHead>Campus</TableHead><TableHead>Institution</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Duration</TableHead>
          </TableRow></TableHeader><TableBody>
            {(programs.data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.campuses?.name}</TableCell>
                <TableCell className="capitalize">{r.institution_type}</TableCell>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.duration_years ? `${r.duration_years} yrs` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table></CardContent></Card>
        </TabsContent>
        <TabsContent value="hostels">
          <Card><CardContent className="p-0"><Table><TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Campus</TableHead><TableHead>Gender</TableHead><TableHead>Capacity</TableHead>
          </TableRow></TableHeader><TableBody>
            {(hostels.data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.campuses?.name}</TableCell>
                <TableCell className="capitalize">{r.gender}</TableCell>
                <TableCell>{r.capacity}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table></CardContent></Card>
        </TabsContent>
        <TabsContent value="docs">
          <Card><CardContent className="p-0"><Table><TableHeader><TableRow>
            <TableHead>Institution</TableHead><TableHead>Category</TableHead><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Required</TableHead><TableHead>Max MB</TableHead>
          </TableRow></TableHeader><TableBody>
            {(docs.data ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="capitalize">{r.institution_type}</TableCell>
                <TableCell className="capitalize">{r.category}</TableCell>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.required ? "Yes" : "No"}</TableCell>
                <TableCell>{r.max_size_mb}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table></CardContent></Card>
        </TabsContent>
        <TabsContent value="years">
          <Card><CardContent className="p-4">{(years.data ?? []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between border-b border-border py-2 last:border-0 text-sm">
              <span>{r.label}</span>{r.is_current && <span className="rounded bg-accent-soft px-2 py-0.5 text-xs text-accent">Current</span>}
            </div>
          ))}</CardContent></Card>
        </TabsContent>
        <TabsContent value="quotas">
          <Card><CardContent className="p-4">{(quotas.data ?? []).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between border-b border-border py-2 last:border-0 text-sm">
              <span className="font-medium">{r.name}</span><span className="font-mono text-xs text-muted-foreground">{r.code}</span>
            </div>
          ))}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
