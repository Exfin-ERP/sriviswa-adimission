import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getApplication, advanceStatus, verifyDocument, getDocumentSignedUrl } from "@/lib/applications.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { APPLICATION_STATUSES, STATUS_LABEL, type ApplicationStatus } from "@/lib/roles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";
import { DocumentAiPanel } from "@/components/DocumentAiPanel";

export const Route = createFileRoute("/_authenticated/applications/$id")({
  head: () => ({ meta: [{ title: "Application — Sri Viswa Admissions" }] }),
  component: Detail,
});

function KV({ label, value }: { label: string; value: any }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-border py-2 text-sm last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 font-medium">{value ?? "—"}</div>
    </div>
  );
}

function Detail() {
  const { id } = Route.useParams();
  const call = useServerFn(getApplication);
  const advance = useServerFn(advanceStatus);
  const verify = useServerFn(verifyDocument);
  const signUrl = useServerFn(getDocumentSignedUrl);
  const qc = useQueryClient();
  const [nextStatus, setNextStatus] = useState<string>("under_review");
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["app", id],
    queryFn: () => call({ data: { id } } as any),
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const { application: a, student, parent, address, academic, hostel, documents, history, payments } = data;
  const selection = a.admission_selection ?? {};
  const categoryLabel = selection.category?.label ?? a.institution_type;
  const branchLabel = selection.branch ? `${selection.branch.id} — ${selection.branch.label}` : a.branches?.name;
  const courseLabel = selection.course?.label ?? a.programs?.name;
  const campusLabel = selection.campus?.label ?? a.campuses?.name;
  const hostelLabel = hostel?.selected_campus_label ?? selection.campus?.label ?? a.hostels?.name;

  async function doAdvance() {
    try {
      await advance({ data: { id, to_status: nextStatus as any, note } } as any);
      toast.success("Status updated");
      setNote("");
      qc.invalidateQueries({ queryKey: ["app", id] });
    } catch (e: any) { toast.error(e.message); }
  }

  async function doVerify(docId: string, status: string) {
    const remarks = status === "rejected" ? prompt("Reason for rejection?") ?? undefined : undefined;
    try {
      await verify({ data: { id: docId, status, remarks } } as any);
      qc.invalidateQueries({ queryKey: ["app", id] });
      toast.success("Document " + status);
    } catch (e: any) { toast.error(e.message); }
  }

  async function openDoc(path: string) {
    try {
      const { url } = await signUrl({ data: { path } } as any);
      window.open(url, "_blank", "noopener");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 no-print">
        <div>
          <Link to="/applications" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Applications
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{a.application_number}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">{a.institution_type}</span> · {campusLabel ?? "—"} · {courseLabel ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={a.status as ApplicationStatus} />
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1 h-3 w-3" /> Print</Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="no-print">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="history">Status History</TabsTrigger>
          <TabsTrigger value="actions" className="text-primary">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Admission Selection</CardTitle></CardHeader><CardContent>
            <KV label="Institution" value={categoryLabel} />
            <KV label="Branch / Unit" value={branchLabel} />
            <KV label="Course / Class" value={courseLabel} />
            <KV label="Campus" value={campusLabel} />
            <KV label="Form Type" value={selection.form_type ?? a.institution_type} />
            <KV label="Hostel Required" value={a.hostel_required ? "Yes" : "No"} />
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-base">Student</CardTitle></CardHeader><CardContent>
            <KV label="Name" value={[student?.first_name, student?.middle_name, student?.last_name].filter(Boolean).join(" ") || "—"} />
            <KV label="Gender" value={student?.gender} />
            <KV label="Date of Birth" value={student?.date_of_birth} />
            <KV label="Aadhaar" value={student?.aadhaar} />
            <KV label="Category" value={student?.category} />
            <KV label="Blood Group" value={student?.blood_group} />
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-base">Parents / Guardian</CardTitle></CardHeader><CardContent>
            <KV label="Father" value={parent?.father_name} />
            <KV label="Father Phone" value={parent?.father_phone} />
            <KV label="Mother" value={parent?.mother_name} />
            <KV label="Mother Phone" value={parent?.mother_phone} />
            <KV label="Guardian" value={parent?.guardian_name} />
            <KV label="Annual Income" value={parent?.father_income} />
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader><CardContent>
            <KV label="Present" value={[address?.present_line1, address?.present_city, address?.present_state, address?.present_pincode].filter(Boolean).join(", ")} />
            <KV label="Permanent" value={[address?.permanent_line1, address?.permanent_city, address?.permanent_state, address?.permanent_pincode].filter(Boolean).join(", ")} />
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="text-base">Academic</CardTitle></CardHeader><CardContent>
            <KV label="Previous School" value={academic?.previous_school} />
            <KV label="Board" value={academic?.previous_board} />
            <KV label="Class / Year" value={[academic?.previous_class, academic?.previous_year].filter(Boolean).join(" · ")} />
            <KV label="Marks %" value={academic?.previous_marks_percent} />
            <KV label="TC Number" value={academic?.tc_number} />
            <KV label="Applying For" value={academic?.applying_for_class ?? academic?.stream ?? courseLabel} />
          </CardContent></Card>

          {a.hostel_required && (
            <Card><CardHeader><CardTitle className="text-base">Hostel</CardTitle></CardHeader><CardContent>
              <KV label="Selected Hostel / Campus" value={hostelLabel} />
              <KV label="Room Type" value={hostel?.room_type} />
              <KV label="Mess" value={hostel?.mess_preference} />
              <KV label="Medical" value={hostel?.medical_conditions} />
              <KV label="Dietary" value={hostel?.dietary_requirements} />
              <KV label="Emergency Contact" value={[hostel?.emergency_contact_name, hostel?.emergency_contact_phone].filter(Boolean).join(" · ")} />
              <KV label="Parent Consent" value={hostel?.parent_consent ? "Yes" : "No"} />
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card><CardContent className="p-4">
            <DocumentAiPanel applicationId={id} documents={documents} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card><CardContent className="p-4">
            {payments.length === 0 ? <div className="text-sm text-muted-foreground">No payments recorded.</div> : (
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div><div className="font-medium">₹{p.amount} · {p.purpose}</div><div className="text-xs text-muted-foreground">{p.provider} · {p.provider_payment_id ?? p.provider_order_id ?? "—"}</div></div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="history">
          <Card><CardContent className="p-4">
            {history.length === 0 ? <div className="text-sm text-muted-foreground">No history.</div> : (
              <ol className="space-y-2">
                {history.map((h: any) => (
                  <li key={h.id} className="flex items-start gap-3 text-sm"><div className="mt-1 h-2 w-2 rounded-full bg-primary" /><div><div>{h.from_status ?? "—"} → <b>{h.to_status}</b></div><div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}{h.note ? ` · ${h.note}` : ""}</div></div></li>
                ))}
              </ol>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card><CardHeader><CardTitle className="text-base">Advance status</CardTitle></CardHeader><CardContent className="space-y-3">
            <Select value={nextStatus} onValueChange={setNextStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{APPLICATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Note (optional, recorded in status history)" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button onClick={doAdvance}>Update status</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
