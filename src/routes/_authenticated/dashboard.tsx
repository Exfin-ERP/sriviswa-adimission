import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { dashboardSummary } from "@/lib/applications.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INSTITUTION_TYPES, STATUS_LABEL, type ApplicationStatus } from "@/lib/roles";
import { FileText, ClipboardCheck, CreditCard, Home, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Sri Viswa Admissions" }] }),
  component: Dashboard,
});

function Stat({ label, value, icon: Icon, tone = "default" }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          </div>
          <div className={`rounded-lg p-2 ${tone === "primary" ? "bg-primary-soft text-primary" : tone === "accent" ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const call = useServerFn(dashboardSummary);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => call({ data: {} } as any),
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const s = data;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of all admission activity.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Applications" value={s.total} icon={FileText} tone="primary" />
        <Stat label="Today's Applications" value={s.today} icon={TrendingUp} tone="accent" />
        <Stat label="Hostel Requests" value={s.hostelRequests} icon={Home} />
        <Stat label="Pending Payment" value={s.byStatus.payment_pending ?? 0} icon={CreditCard} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(Object.keys(s.byStatus) as ApplicationStatus[]).map((k) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{STATUS_LABEL[k] ?? k}</span>
                  <span className="font-semibold">{s.byStatus[k]}</span>
                </div>
              ))}
              {Object.keys(s.byStatus).length === 0 && <div className="text-sm text-muted-foreground">No applications yet.</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">By Institution</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {INSTITUTION_TYPES.map((t) => (
                <div key={t.value} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t.label}</span>
                  <span className="font-semibold">{s.byInstitution[t.value] ?? 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Verified & Approved</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Verified Docs" value={s.byStatus.documents_verified ?? 0} icon={ClipboardCheck} />
            <Stat label="Approved" value={s.byStatus.approved ?? 0} icon={ClipboardCheck} tone="accent" />
            <Stat label="Confirmed" value={s.byStatus.admission_confirmed ?? 0} icon={ClipboardCheck} tone="accent" />
            <Stat label="Rejected" value={s.byStatus.rejected ?? 0} icon={ClipboardCheck} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
