import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const VERIFIER_ROLES = ["super_admin", "admin", "doc_verifier", "admission_staff", "hostel_admin"];
export const AI_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Runs AI extraction on an uploaded document and stores flags on the document row. */
export const runDocumentAiCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ document_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    const { userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!(roles ?? []).some((r: any) => VERIFIER_ROLES.includes(r.role))) throw new Error("Forbidden: verifier role required");

    const { data: doc, error } = await supabase.from("application_documents").select("*").eq("id", data.document_id).single();
    if (error || !doc) throw new Error("Document not found");
    const mime = doc.mime_type ?? "";
    if (!AI_IMAGE_TYPES.includes(mime)) throw new Error("AI check supports JPG, PNG or WEBP images only. Verify PDFs manually.");
    if ((doc.file_size ?? 0) > 8 * 1024 * 1024) throw new Error("File too large for AI check (max 8 MB)");

    const appId = doc.application_id;
    const [app, student, parent, academic] = await Promise.all([
      supabase.from("applications").select("application_number, admission_selection").eq("id", appId).single(),
      supabase.from("application_student_details").select("*").eq("application_id", appId).maybeSingle(),
      supabase.from("application_parent_details").select("*").eq("application_id", appId).maybeSingle(),
      supabase.from("application_academic_history").select("*").eq("application_id", appId).maybeSingle(),
    ]);
    const s = student.data ?? {}, p = parent.data ?? {}, a = academic.data ?? {};
    const facts: Record<string, string | null> = {
      student_full_name: [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ") || null,
      date_of_birth: s.date_of_birth ?? null,
      gender: s.gender ?? null,
      aadhaar: s.aadhaar ?? null,
      father_name: p.father_name ?? null,
      mother_name: p.mother_name ?? null,
      previous_school: a.previous_school ?? null,
      previous_board: a.previous_board ?? null,
      previous_class: a.previous_class ?? null,
      year_of_passing: a.previous_year ?? null,
      marks_percent: a.previous_marks_percent != null ? String(a.previous_marks_percent) : null,
      tc_number: a.tc_number ?? null,
      course_applied: app.data?.admission_selection?.course?.label ?? null,
    };

    const { data: blob, error: dlErr } = await supabase.storage.from("application-documents").download(doc.file_path);
    if (dlErr || !blob) throw new Error("Could not read the file from storage");
    const bytes = new Uint8Array(await blob.arrayBuffer());

    const { analyzeDocumentImage } = await import("./doc-ai.server");
    const result = await analyzeDocumentImage({ bytes, mimeType: mime, documentName: doc.document_code, applicationFacts: facts });
    const mismatches = result.checks.filter((c) => c.result === "mismatch").length;
    const ai_status = !result.readable ? "unreadable" : mismatches > 0 ? "mismatch" : "ok";

    const { error: upErr } = await supabase.from("application_documents").update({
      ai_status, ai_summary: result.summary, ai_extracted: result.extracted, ai_flags: result.checks,
      ai_checked_at: new Date().toISOString(), ai_checked_by: userId,
    }).eq("id", doc.id);
    if (upErr) throw new Error(upErr.message);
    await supabase.from("audit_logs").insert({
      actor_id: userId, action: "document.ai_check", entity: "document", entity_id: doc.id,
      meta: { ai_status, mismatches, detected: result.document_type_detected },
    });
    return { ai_status, ...result };
  });
