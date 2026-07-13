import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ALLOWED_STATUSES = [
  "draft","submitted","under_review","documents_pending","documents_verified",
  "payment_pending","payment_completed","approved","rejected","admission_confirmed",
] as const;

async function actorRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

/* ---------------- CREATE / SAVE DRAFT ---------------- */
export const createOrUpdateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id?: string;
    institution_type: string;
    campus_id?: string | null;
    program_id?: string | null;
    branch_id?: string | null;
    academic_year_id?: string | null;
    quota_id?: string | null;
    hostel_required?: boolean;
    hostel_id?: string | null;
    admission_selection?: Record<string, unknown> | null;
    student?: Record<string, unknown>;
    parent?: Record<string, unknown>;
    address?: Record<string, unknown>;
    academic?: Record<string, unknown>;
    hostel?: Record<string, unknown>;
    submit?: boolean;
  }) => input)
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    const { userId } = context;
    let appId = data.id;

    const applicationPatch: any = {
      institution_type: data.institution_type,
      campus_id: data.campus_id ?? null,
      program_id: data.program_id ?? null,
      branch_id: data.branch_id ?? null,
      academic_year_id: data.academic_year_id ?? null,
      quota_id: data.quota_id ?? null,
      hostel_required: !!data.hostel_required,
      hostel_id: data.hostel_id ?? null,
      admission_selection: data.admission_selection ?? {},
    };
    if (data.submit) {
      applicationPatch.status = "submitted";
      applicationPatch.submitted_at = new Date().toISOString();
    }

    if (!appId) {
      const { data: created, error } = await supabase
        .from("applications")
        .insert({ ...applicationPatch, applicant_user_id: userId, status: data.submit ? "submitted" : "draft" })
        .select("id, application_number")
        .single();
      if (error) throw new Error(error.message);
      appId = created.id;
    } else {
      const { error } = await supabase.from("applications").update(applicationPatch).eq("id", appId);
      if (error) throw new Error(error.message);
    }

    const upserts: Array<[string, Record<string, unknown> | undefined]> = [
      ["application_student_details", data.student],
      ["application_parent_details", data.parent],
      ["application_address_details", data.address],
      ["application_academic_history", data.academic],
      ["application_hostel_details", data.hostel_required ? data.hostel : undefined],
    ];
    for (const [table, payload] of upserts) {
      if (!payload) continue;
      const { error } = await supabase.from(table).upsert({ ...payload, application_id: appId });
      if (error) throw new Error(`${table}: ${error.message}`);
    }

    if (data.submit) {
      await supabase.from("status_history").insert({
        application_id: appId, from_status: "draft", to_status: "submitted", actor_id: userId,
      });
      await supabase.from("audit_logs").insert({
        actor_id: userId, action: "application.submit", entity: "application", entity_id: appId,
      });
    }

    const { data: full } = await supabase
      .from("applications")
      .select("id, application_number, status, admission_selection")
      .eq("id", appId)
      .single();
    return full!;
  });

/* ---------------- LIST APPLICATIONS ---------------- */
export const listApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    status?: string; institution_type?: string; campus_id?: string;
    academic_year_id?: string; search?: string; limit?: number; offset?: number;
  }) => input)
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    let q = supabase
      .from("applications")
      .select(
        "id, application_number, institution_type, admission_selection, status, campus_id, program_id, hostel_required, applicant_email, submitted_at, created_at, campuses(name), programs(name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(data.limit ?? 50, 200))
      .range(data.offset ?? 0, (data.offset ?? 0) + Math.min(data.limit ?? 50, 200) - 1);
    if (data.status) q = q.eq("status", data.status);
    if (data.institution_type) q = q.eq("institution_type", data.institution_type);
    if (data.campus_id) q = q.eq("campus_id", data.campus_id);
    if (data.academic_year_id) q = q.eq("academic_year_id", data.academic_year_id);
    if (data.search) q = q.ilike("application_number", `%${data.search}%`);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], count: count ?? 0 };
  });

/* ---------------- APPLICATION DETAIL ---------------- */
export const getApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    const { data: app, error } = await supabase.from("applications")
      .select("*, campuses(name, code), programs(name, code), branches(name, code), hostels(name), academic_years(label), quotas(name)")
      .eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const [student, parent, address, academic, hostel, docs, history, payments] = await Promise.all([
      supabase.from("application_student_details").select("*").eq("application_id", data.id).maybeSingle(),
      supabase.from("application_parent_details").select("*").eq("application_id", data.id).maybeSingle(),
      supabase.from("application_address_details").select("*").eq("application_id", data.id).maybeSingle(),
      supabase.from("application_academic_history").select("*").eq("application_id", data.id).maybeSingle(),
      supabase.from("application_hostel_details").select("*").eq("application_id", data.id).maybeSingle(),
      supabase.from("application_documents").select("*").eq("application_id", data.id).order("uploaded_at"),
      supabase.from("status_history").select("*").eq("application_id", data.id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("application_id", data.id).order("created_at", { ascending: false }),
    ]);
    return {
      application: app,
      student: student.data, parent: parent.data, address: address.data,
      academic: academic.data, hostel: hostel.data,
      documents: docs.data ?? [], history: history.data ?? [], payments: payments.data ?? [],
    };
  });

/* ---------------- ADVANCE STATUS ---------------- */
const StatusSchema = z.object({
  id: z.string().uuid(),
  to_status: z.enum(ALLOWED_STATUSES),
  note: z.string().max(1000).optional(),
});
export const advanceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase; const { userId } = context;
    const roles = await actorRoles(supabase, userId);
    if (!roles.some((r: string) => ["super_admin","admin","head_office","campus_operator","admission_staff","accounts","hostel_admin"].includes(r))) {
      throw new Error("Forbidden");
    }
    const { data: current, error: e0 } = await supabase.from("applications").select("status, campus_id").eq("id", data.id).single();
    if (e0) throw new Error(e0.message);
    const { error } = await supabase.from("applications").update({ status: data.to_status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabase.from("status_history").insert({
      application_id: data.id, from_status: current!.status, to_status: data.to_status,
      actor_id: userId, note: data.note ?? null,
    });
    await supabase.from("audit_logs").insert({
      actor_id: userId, action: "application.status_change", entity: "application", entity_id: data.id,
      meta: { from: current!.status, to: data.to_status, note: data.note ?? null },
    });
    return { ok: true };
  });

/* ---------------- DOCUMENT VERIFICATION ---------------- */
export const verifyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "verified" | "rejected" | "reupload_required" | "pending"; remarks?: string }) => input)
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase; const { userId } = context;
    const roles = await actorRoles(supabase, userId);
    if (!roles.some((r: string) => ["super_admin","admin","doc_verifier","admission_staff","hostel_admin"].includes(r))) {
      throw new Error("Forbidden");
    }
    const { error } = await supabase.from("application_documents").update({
      verification_status: data.status,
      remarks: data.remarks ?? null,
      verified_by: userId,
      verified_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabase.from("audit_logs").insert({
      actor_id: userId, action: "document.verify", entity: "document", entity_id: data.id,
      meta: { status: data.status, remarks: data.remarks ?? null },
    });
    return { ok: true };
  });

/* ---------------- SAVE DOCUMENT METADATA ---------------- */
export const saveDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    application_id: string; definition_id?: string | null; document_code: string;
    file_path: string; file_name?: string; file_size?: number; mime_type?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    const { error, data: row } = await supabase.from("application_documents")
      .insert({
        application_id: data.application_id,
        definition_id: data.definition_id ?? null,
        document_code: data.document_code,
        file_path: data.file_path,
        file_name: data.file_name ?? null,
        file_size: data.file_size ?? null,
        mime_type: data.mime_type ?? null,
      })
      .select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

/* ---------------- SIGNED URL ---------------- */
export const getDocumentSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => input)
  .handler(async ({ data, context }) => {
    const supabase: any = context.supabase;
    const { data: signed, error } = await supabase.storage.from("application-documents").createSignedUrl(data.path, 300);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

/* ---------------- DASHBOARD SUMMARY ---------------- */
export const dashboardSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase: any = context.supabase;
    const { data, error } = await supabase.from("applications").select("status, institution_type, campus_id, hostel_required, created_at");
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const byStatus: Record<string, number> = {};
    const byInstitution: Record<string, number> = {};
    const byCampus: Record<string, number> = {};
    let hostelRequests = 0, today = 0;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    for (const r of rows) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byInstitution[r.institution_type] = (byInstitution[r.institution_type] ?? 0) + 1;
      if (r.campus_id) byCampus[r.campus_id] = (byCampus[r.campus_id] ?? 0) + 1;
      if (r.hostel_required) hostelRequests++;
      if (new Date(r.created_at) >= t) today++;
    }
    return { total: rows.length, byStatus, byInstitution, byCampus, hostelRequests, today };
  });