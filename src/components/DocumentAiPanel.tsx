import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveDocument, verifyDocument, getDocumentSignedUrl } from "@/lib/applications.functions";
import { runDocumentAiCheck } from "@/lib/doc-ai.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, FileText, Loader2, Sparkles, Upload, X, AlertTriangle } from "lucide-react";

const AI_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function DocumentAiPanel({ applicationId, documents }: { applicationId: string; documents: any[] }) {
  const qc = useQueryClient();
  const save = useServerFn(saveDocument);
  const verify = useServerFn(verifyDocument);
  const signUrl = useServerFn(getDocumentSignedUrl);
  const aiCheck = useServerFn(runDocumentAiCheck);
  const [defId, setDefId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  const { data: defs = [] } = useQuery({
    queryKey: ["doc-defs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_definitions").select("id, code, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["app", applicationId] });

  async function upload(file: File) {
    const def = defs.find((d: any) => d.id === defId);
    if (!def) return toast.error("Choose a document type first");
    if (file.size > 8 * 1024 * 1024) return toast.error("File exceeds 8 MB");
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${u.user!.id}/${applicationId}/${def.code}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("application-documents").upload(path, file);
      if (error) throw error;
      const row: any = await save({ data: {
        application_id: applicationId, definition_id: def.id, document_code: def.code,
        file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type,
      } } as any);
      toast.success(`${def.name} uploaded`);
      refresh();
      if (AI_TYPES.includes(file.type) && row?.id) await check(row.id);
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  }

  async function check(id: string) {
    setChecking(id);
    try {
      const r: any = await aiCheck({ data: { document_id: id } } as any);
      if (r.ai_status === "mismatch") toast.warning("AI found mismatches — please review");
      else if (r.ai_status === "unreadable") toast.warning("AI could not read the document clearly");
      else toast.success("AI check: details match");
      refresh();
    } catch (e: any) { toast.error(e.message); } finally { setChecking(null); }
  }

  async function doVerify(docId: string, status: string) {
    const remarks = status === "rejected" ? prompt("Reason for rejection?") ?? undefined : undefined;
    try { await verify({ data: { id: docId, status, remarks } } as any); refresh(); toast.success("Document " + status); }
    catch (e: any) { toast.error(e.message); }
  }
  async function openDoc(path: string) {
    try { const { url } = await signUrl({ data: { path } } as any); window.open(url, "_blank", "noopener"); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-dashed border-border p-3">
        <div className="mb-2 text-sm font-medium">Upload on behalf of applicant</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-64">
            <Select value={defId} onValueChange={setDefId}>
              <SelectTrigger aria-label="Document type"><SelectValue placeholder="Document type" /></SelectTrigger>
              <SelectContent>{defs.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className={defId ? "cursor-pointer" : "pointer-events-none opacity-50"}>
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!defId || uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            <Button size="sm" type="button" asChild><span>{uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}Upload & AI check</span></Button>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Images (JPG/PNG/WEBP) are read by AI automatically; PDFs must be verified manually. AI results are advisory — staff make the final decision.</p>
      </div>

      {documents.length === 0 && <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>}
      {documents.map((d: any) => {
        const flags: any[] = Array.isArray(d.ai_flags) ? d.ai_flags : [];
        const extracted: any[] = Array.isArray(d.ai_extracted) ? d.ai_extracted : [];
        const canAi = AI_TYPES.includes(d.mime_type ?? "");
        return (
          <div key={d.id} className="rounded-md border border-border bg-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" /> {d.document_code}
                  {d.ai_status && <AiBadge status={d.ai_status} />}
                </div>
                <div className="text-xs text-muted-foreground">{d.file_name} · {d.verification_status}{d.remarks ? ` · ${d.remarks}` : ""}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openDoc(d.file_path)}>Open</Button>
                <Button size="sm" variant="outline" disabled={!canAi || checking === d.id} onClick={() => check(d.id)} title={canAi ? "" : "AI supports images only"}>
                  {checking === d.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}{d.ai_status ? "Re-check" : "AI check"}
                </Button>
                <Button size="sm" variant="outline" className="text-accent" onClick={() => doVerify(d.id, "verified")}><Check className="mr-1 h-3 w-3" /> Verify</Button>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => doVerify(d.id, "rejected")}><X className="mr-1 h-3 w-3" /> Reject</Button>
              </div>
            </div>
            {d.ai_status && (
              <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs">
                {d.ai_summary && <div className="text-muted-foreground">{d.ai_summary}</div>}
                {flags.length > 0 && (
                  <table className="w-full text-left">
                    <thead className="text-muted-foreground"><tr><th className="py-1">Field</th><th>Document</th><th>Application</th><th>Result</th></tr></thead>
                    <tbody>{flags.map((f, i) => (
                      <tr key={i} className="border-t border-border align-top">
                        <td className="py-1 font-medium">{f.field}</td><td>{f.document_value ?? "—"}</td><td>{f.application_value ?? "—"}</td>
                        <td className={f.result === "mismatch" ? "font-semibold text-destructive" : f.result === "match" ? "text-accent" : "text-muted-foreground"} title={f.note}>{f.result}</td>
                      </tr>))}</tbody>
                  </table>
                )}
                {extracted.length > 0 && (
                  <details><summary className="cursor-pointer text-muted-foreground">Extracted details ({extracted.length})</summary>
                    <ul className="mt-1 grid gap-1 md:grid-cols-2">{extracted.map((x, i) => <li key={i}><b>{x.field}:</b> {x.value}</li>)}</ul>
                  </details>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AiBadge({ status }: { status: string }) {
  if (status === "ok") return <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">AI: match</span>;
  if (status === "mismatch") return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />AI: mismatch</span>;
  return <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs">AI: unreadable</span>;
}
