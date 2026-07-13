import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createOrUpdateApplication, saveDocument } from "@/lib/applications.functions";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, FileUp, Loader2, Upload } from "lucide-react";
import { INSTITUTION_TYPES, type InstitutionType } from "@/lib/roles";
import {
  institutionCategories,
  getBranchesByInstitutionCategory,
  getCoursesByCategoryAndBranch,
  getCampusesByBranchAndCourse,
  getAdmissionFormType,
  isHostelBranch,
  isHostelCampus,
  getBranchById,
  getCourseById,
  getCampusById,
  type InstitutionCategoryId,
} from "@/data/sriVishwaAdmissionMasters";

const applySearchSchema = z.object({ type: z.enum(["school","intermediate","college","degree","hostel"]).optional() });

export const Route = createFileRoute("/apply")({
  head: () => ({ meta: [{ title: "Apply — Sri Viswa Admissions" }] }),
  validateSearch: applySearchSchema,
  component: ApplyPage,
});

const STEPS = [
  "Basics", "Institution", "Student", "Parents", "Address",
  "Academics", "Hostel", "Documents", "Declaration", "Payment", "Review",
] as const;

function ApplyPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  if (session === null) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <Logo />
        <h1 className="mt-8 text-2xl font-bold">Create an account to apply</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          To save your progress, upload documents and pay online, you need a Sri Viswa applicant account.
        </p>
        <div className="mt-6 flex gap-2">
          <Button onClick={() => navigate({ to: "/auth" })}>Sign in / Create account</Button>
          <Link to="/"><Button variant="outline">Cancel</Button></Link>
        </div>
      </div>
    );
  }
  return <Wizard initialType={search.type} session={session} />;
}

type FormData = {
  id?: string;
  application_number?: string;
  institution_type: InstitutionType;
  campus_id?: string;
  program_id?: string;
  branch_id?: string;
  academic_year_id?: string;
  quota_id?: string;
  hostel_required: boolean;
  hostel_id?: string;
  // Local Sri Viswa selection (not persisted to Supabase yet)
  sel_category?: InstitutionCategoryId;
  sel_branch?: string;
  sel_course?: string;
  sel_campus?: string;
  student: any;
  parent: any;
  address: any;
  academic: any;
  hostel: any;
  declaration_accepted: boolean;
};

const emptyForm = (type: InstitutionType): FormData => ({
  institution_type: type,
  hostel_required: type === "hostel",
  student: { first_name: "", last_name: "", gender: "male", date_of_birth: "" },
  parent: {},
  address: { same_as_present: false },
  academic: {},
  hostel: {},
  declaration_accepted: false,
});

function Wizard({ initialType, session }: { initialType?: InstitutionType; session: any }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm(initialType ?? "school"));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const saveFn = useServerFn(createOrUpdateApplication);
  const saveDocFn = useServerFn(saveDocument);
  const navigate = useNavigate();

  const upd = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }));

  // Master data
  const [campuses, setCampuses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [docDefs, setDocDefs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [c, y, q] = await Promise.all([
        supabase.from("campuses").select("id,name,supported_types").order("name"),
        supabase.from("academic_years").select("id,code,label,is_current").order("code"),
        supabase.from("quotas").select("id,code,name").order("code"),
      ]);
      setCampuses(c.data ?? []); setYears(y.data ?? []); setQuotas(q.data ?? []);
      const cur = (y.data ?? []).find((yy: any) => yy.is_current);
      if (cur) upd({ academic_year_id: cur.id });
    })();
  }, []);

  useEffect(() => {
    if (!form.campus_id) { setPrograms([]); return; }
    (async () => {
      const { data } = await supabase.from("programs")
        .select("id,name,code,duration_years")
        .eq("campus_id", form.campus_id!)
        .eq("institution_type", form.institution_type)
        .order("name");
      setPrograms(data ?? []);
    })();
    (async () => {
      const { data } = await supabase.from("hostels").select("id,name,gender,room_types").eq("campus_id", form.campus_id!);
      setHostels(data ?? []);
    })();
  }, [form.campus_id, form.institution_type]);

  useEffect(() => {
    if (!form.program_id) { setBranches([]); return; }
    (async () => {
      const { data } = await supabase.from("branches").select("id,name,code").eq("program_id", form.program_id!).order("name");
      setBranches(data ?? []);
    })();
  }, [form.program_id]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("document_definitions")
        .select("*").eq("institution_type", form.institution_type).eq("is_active", true).order("category");
      setDocDefs(data ?? []);
    })();
  }, [form.institution_type]);

  useEffect(() => {
    if (!form.id) return;
    (async () => {
      const { data } = await supabase.from("application_documents").select("*").eq("application_id", form.id!);
      setDocs(data ?? []);
    })();
  }, [form.id]);

  async function saveDraft(submit = false) {
    if (submit) setSubmitting(true); else setSaving(true);
    try {
      const payload = {
        id: form.id,
        institution_type: form.institution_type,
        campus_id: form.campus_id,
        program_id: form.program_id,
        branch_id: form.branch_id,
        academic_year_id: form.academic_year_id,
        quota_id: form.quota_id,
        hostel_required: form.hostel_required,
        hostel_id: form.hostel_required ? form.hostel_id : null,
        student: form.student,
        parent: form.parent,
        address: form.address,
        academic: form.academic,
        hostel: form.hostel,
        submit,
      };
      const res = await saveFn({ data: payload } as any);
      upd({ id: res.id, application_number: res.application_number });
      if (submit) {
        toast.success("Application submitted");
        navigate({ to: "/apply/success/$appNo", params: { appNo: res.application_number! } });
      } else {
        toast.success("Draft saved");
      }
      return res;
    } catch (e: any) {
      toast.error(e.message);
      throw e;
    } finally {
      setSaving(false); setSubmitting(false);
    }
  }

  async function next() {
    // Save draft on each transition once we have institution + academic year.
    if (step >= 1 && form.academic_year_id) {
      try { await saveDraft(false); } catch { return; }
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  const prev = () => setStep((s) => Math.max(0, s - 1));

  async function uploadFile(def: any, file: File) {
    if (!form.id) { toast.error("Save draft first (complete step 2)"); return; }
    if (file.size > def.max_size_mb * 1024 * 1024) { toast.error(`File exceeds ${def.max_size_mb} MB`); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!def.allowed_formats.includes(ext)) { toast.error(`Allowed: ${def.allowed_formats.join(", ")}`); return; }
    const path = `${session.user.id}/${form.id}/${def.code}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("application-documents").upload(path, file, { upsert: false });
    if (error) return toast.error(error.message);
    try {
      await saveDocFn({ data: {
        application_id: form.id, definition_id: def.id, document_code: def.code,
        file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type,
      } } as any);
      const { data } = await supabase.from("application_documents").select("*").eq("application_id", form.id!);
      setDocs(data ?? []);
      toast.success(`${def.name} uploaded`);
    } catch (e: any) { toast.error(e.message); }
  }

  const canProceed = useMemo(() => {
    if (step === 0) return !!form.sel_category && !!form.sel_branch && !!form.sel_course && !!form.sel_campus;
    if (step === 1) return !!form.academic_year_id;
    if (step === 2) return form.student.first_name && form.student.last_name && form.student.date_of_birth;
    if (step === 3) return form.parent.father_name && form.parent.father_phone;
    if (step === 4) return form.address.present_line1 && form.address.present_city && form.address.present_pincode;
    if (step === 8) return form.declaration_accepted;
    return true;
  }, [step, form]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo size={40} />
          <div className="text-xs text-muted-foreground">
            {form.application_number && <span className="rounded bg-muted px-2 py-1 font-mono">#{form.application_number}</span>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        {/* Progress */}
        <ol className="mb-8 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
              i === step ? "border-primary bg-primary-soft text-primary font-semibold" :
              i < step ? "border-accent/40 bg-accent-soft text-accent" : "border-border text-muted-foreground"
            }`}>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold">
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>{s}
            </li>
          ))}
        </ol>

        <Card><CardContent className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{step + 1}. {STEPS[step]}</h2>
          </div>

          {step === 0 && (() => {
            const branchOptions = getBranchesByInstitutionCategory(form.sel_category);
            const courseOptions = getCoursesByCategoryAndBranch(form.sel_category, form.sel_branch);
            const campusOptions = getCampusesByBranchAndCourse(form.sel_branch, form.sel_course);
            const formType = getAdmissionFormType(form.sel_category);
            const isHostel = isHostelBranch(form.sel_branch) || isHostelCampus(form.sel_campus);
            return (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Select your institution, branch, course and campus. Each dropdown unlocks the next.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>1. Institution Category *</Label>
                    <Select
                      value={form.sel_category ?? ""}
                      onValueChange={(v) => {
                        const cat = v as InstitutionCategoryId;
                        const ft = getAdmissionFormType(cat) ?? "school";
                        upd({
                          sel_category: cat,
                          sel_branch: undefined,
                          sel_course: undefined,
                          sel_campus: undefined,
                          institution_type: ft as InstitutionType,
                          hostel_required: false,
                        });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger>
                      <SelectContent>
                        {institutionCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>2. Branch / Unit *</Label>
                    <Select
                      value={form.sel_branch ?? ""}
                      onValueChange={(v) => {
                        const hostel = isHostelBranch(v);
                        upd({ sel_branch: v, sel_course: undefined, sel_campus: undefined, hostel_required: hostel });
                      }}
                      disabled={!form.sel_category || branchOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.sel_category ? "Select branch" : "Select category first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {branchOptions.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.id} — {b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>3. Course / Class *</Label>
                    <Select
                      value={form.sel_course ?? ""}
                      onValueChange={(v) => upd({ sel_course: v, sel_campus: undefined })}
                      disabled={!form.sel_branch || courseOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.sel_branch ? "Select course" : "Select branch first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {courseOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>4. Campus *</Label>
                    <Select
                      value={form.sel_campus ?? ""}
                      onValueChange={(v) => {
                        const hostel = isHostelBranch(form.sel_branch) || isHostelCampus(v);
                        upd({ sel_campus: v, hostel_required: hostel });
                      }}
                      disabled={!form.sel_course || campusOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={form.sel_course ? (campusOptions.length ? "Select campus" : "No campus available") : "Select course first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {campusOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.sel_category && form.sel_branch && form.sel_course && form.sel_campus && (
                  <div className="rounded-md border border-primary/30 bg-primary-soft p-3 text-sm text-primary">
                    You will fill the <b>{formType === "intermediate" ? "Intermediate" : formType === "degree" ? "Degree" : "School"} Admission Form</b>
                    {isHostel ? " with a Hostel Details section." : "."}
                  </div>
                )}
              </div>
            );
          })()}

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/30 p-4 text-sm space-y-1">
                <div><b>Institution:</b> {institutionCategories.find((c) => c.id === form.sel_category)?.label}</div>
                <div><b>Branch:</b> {getBranchById(form.sel_branch)?.id} — {getBranchById(form.sel_branch)?.label}</div>
                <div><b>Course:</b> {getCourseById(form.sel_course)?.label}</div>
                <div><b>Campus:</b> {getCampusById(form.sel_campus)?.label}</div>
                <div><b>Hostel required:</b> {form.hostel_required ? "Yes" : "No"}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Academic Year *</Label>
                  <Select value={form.academic_year_id ?? ""} onValueChange={(v) => upd({ academic_year_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>{years.map((y) => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Category / Quota</Label>
                  <Select value={form.quota_id ?? ""} onValueChange={(v) => upd({ quota_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{quotas.map((q) => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {form.institution_type !== "hostel" && !isHostelBranch(form.sel_branch) && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 rounded-md border border-border p-3">
                      <Checkbox checked={form.hostel_required} onCheckedChange={(v) => upd({ hostel_required: !!v })} />
                      <span className="text-sm">I also need hostel accommodation</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>First name *</Label><Input value={form.student.first_name ?? ""} onChange={(e) => upd({ student: { ...form.student, first_name: e.target.value } })} /></div>
              <div><Label>Middle name</Label><Input value={form.student.middle_name ?? ""} onChange={(e) => upd({ student: { ...form.student, middle_name: e.target.value } })} /></div>
              <div><Label>Last name *</Label><Input value={form.student.last_name ?? ""} onChange={(e) => upd({ student: { ...form.student, last_name: e.target.value } })} /></div>
              <div><Label>Date of birth *</Label><Input type="date" value={form.student.date_of_birth ?? ""} onChange={(e) => upd({ student: { ...form.student, date_of_birth: e.target.value } })} /></div>
              <div><Label>Gender</Label>
                <Select value={form.student.gender ?? "male"} onValueChange={(v) => upd({ student: { ...form.student, gender: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Blood group</Label><Input value={form.student.blood_group ?? ""} onChange={(e) => upd({ student: { ...form.student, blood_group: e.target.value } })} /></div>
              <div><Label>Aadhaar</Label><Input value={form.student.aadhaar ?? ""} onChange={(e) => upd({ student: { ...form.student, aadhaar: e.target.value } })} /></div>
              <div><Label>Category</Label><Input value={form.student.category ?? ""} onChange={(e) => upd({ student: { ...form.student, category: e.target.value } })} /></div>
              <div><Label>Nationality</Label><Input value={form.student.nationality ?? "Indian"} onChange={(e) => upd({ student: { ...form.student, nationality: e.target.value } })} /></div>
              <div><Label>Religion</Label><Input value={form.student.religion ?? ""} onChange={(e) => upd({ student: { ...form.student, religion: e.target.value } })} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Father's name *</Label><Input value={form.parent.father_name ?? ""} onChange={(e) => upd({ parent: { ...form.parent, father_name: e.target.value } })} /></div>
              <div><Label>Father's phone *</Label><Input type="tel" value={form.parent.father_phone ?? ""} onChange={(e) => upd({ parent: { ...form.parent, father_phone: e.target.value } })} /></div>
              <div><Label>Father's occupation</Label><Input value={form.parent.father_occupation ?? ""} onChange={(e) => upd({ parent: { ...form.parent, father_occupation: e.target.value } })} /></div>
              <div><Label>Father's email</Label><Input type="email" value={form.parent.father_email ?? ""} onChange={(e) => upd({ parent: { ...form.parent, father_email: e.target.value } })} /></div>
              <div><Label>Annual income (₹)</Label><Input type="number" value={form.parent.father_income ?? ""} onChange={(e) => upd({ parent: { ...form.parent, father_income: e.target.value } })} /></div>
              <div><Label>Mother's name</Label><Input value={form.parent.mother_name ?? ""} onChange={(e) => upd({ parent: { ...form.parent, mother_name: e.target.value } })} /></div>
              <div><Label>Mother's phone</Label><Input type="tel" value={form.parent.mother_phone ?? ""} onChange={(e) => upd({ parent: { ...form.parent, mother_phone: e.target.value } })} /></div>
              <div><Label>Mother's occupation</Label><Input value={form.parent.mother_occupation ?? ""} onChange={(e) => upd({ parent: { ...form.parent, mother_occupation: e.target.value } })} /></div>
              <div><Label>Guardian name (if applicable)</Label><Input value={form.parent.guardian_name ?? ""} onChange={(e) => upd({ parent: { ...form.parent, guardian_name: e.target.value } })} /></div>
              <div><Label>Guardian phone</Label><Input value={form.parent.guardian_phone ?? ""} onChange={(e) => upd({ parent: { ...form.parent, guardian_phone: e.target.value } })} /></div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2"><Label>Present address line 1 *</Label><Input value={form.address.present_line1 ?? ""} onChange={(e) => upd({ address: { ...form.address, present_line1: e.target.value } })} /></div>
                <div className="md:col-span-2"><Label>Present address line 2</Label><Input value={form.address.present_line2 ?? ""} onChange={(e) => upd({ address: { ...form.address, present_line2: e.target.value } })} /></div>
                <div><Label>City *</Label><Input value={form.address.present_city ?? ""} onChange={(e) => upd({ address: { ...form.address, present_city: e.target.value } })} /></div>
                <div><Label>State *</Label><Input value={form.address.present_state ?? ""} onChange={(e) => upd({ address: { ...form.address, present_state: e.target.value } })} /></div>
                <div><Label>Pincode *</Label><Input value={form.address.present_pincode ?? ""} onChange={(e) => upd({ address: { ...form.address, present_pincode: e.target.value } })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.address.same_as_present} onCheckedChange={(v) => upd({ address: { ...form.address, same_as_present: !!v } })} />
                Permanent address is same as present
              </label>
              {!form.address.same_as_present && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2"><Label>Permanent address line 1</Label><Input value={form.address.permanent_line1 ?? ""} onChange={(e) => upd({ address: { ...form.address, permanent_line1: e.target.value } })} /></div>
                  <div><Label>City</Label><Input value={form.address.permanent_city ?? ""} onChange={(e) => upd({ address: { ...form.address, permanent_city: e.target.value } })} /></div>
                  <div><Label>State</Label><Input value={form.address.permanent_state ?? ""} onChange={(e) => upd({ address: { ...form.address, permanent_state: e.target.value } })} /></div>
                  <div><Label>Pincode</Label><Input value={form.address.permanent_pincode ?? ""} onChange={(e) => upd({ address: { ...form.address, permanent_pincode: e.target.value } })} /></div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Previous school / college</Label><Input value={form.academic.previous_school ?? ""} onChange={(e) => upd({ academic: { ...form.academic, previous_school: e.target.value } })} /></div>
              <div><Label>Board / University</Label><Input value={form.academic.previous_board ?? ""} onChange={(e) => upd({ academic: { ...form.academic, previous_board: e.target.value } })} /></div>
              <div><Label>Last class / qualification</Label><Input value={form.academic.previous_class ?? ""} onChange={(e) => upd({ academic: { ...form.academic, previous_class: e.target.value } })} /></div>
              <div><Label>Year of passing</Label><Input value={form.academic.previous_year ?? ""} onChange={(e) => upd({ academic: { ...form.academic, previous_year: e.target.value } })} /></div>
              <div><Label>Marks / percentage</Label><Input type="number" step="0.01" value={form.academic.previous_marks_percent ?? ""} onChange={(e) => upd({ academic: { ...form.academic, previous_marks_percent: e.target.value } })} /></div>
              <div><Label>TC number</Label><Input value={form.academic.tc_number ?? ""} onChange={(e) => upd({ academic: { ...form.academic, tc_number: e.target.value } })} /></div>
              {(form.institution_type === "college" || form.institution_type === "degree") && (
                <div><Label>Migration certificate no.</Label><Input value={form.academic.migration_number ?? ""} onChange={(e) => upd({ academic: { ...form.academic, migration_number: e.target.value } })} /></div>
              )}
              {form.institution_type === "school" && (
                <div><Label>Applying for class</Label><Input value={form.academic.applying_for_class ?? ""} onChange={(e) => upd({ academic: { ...form.academic, applying_for_class: e.target.value } })} /></div>
              )}
              {form.institution_type === "intermediate" && (
                <div><Label>Stream (MPC / BiPC / CEC / MEC / HEC)</Label><Input value={form.academic.stream ?? ""} onChange={(e) => upd({ academic: { ...form.academic, stream: e.target.value } })} /></div>
              )}
              <div className="md:col-span-2"><Label>Remarks</Label><Textarea value={form.academic.remarks ?? ""} onChange={(e) => upd({ academic: { ...form.academic, remarks: e.target.value } })} /></div>
            </div>
          )}

          {step === 6 && (
            form.hostel_required ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Hostel</Label>
                  <Select value={form.hostel_id ?? ""} onValueChange={(v) => upd({ hostel_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select hostel" /></SelectTrigger>
                    <SelectContent>{hostels.map((h) => <SelectItem key={h.id} value={h.id}>{h.name} ({h.gender})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Room type preference</Label>
                  <Select value={form.hostel.room_type ?? ""} onValueChange={(v) => upd({ hostel: { ...form.hostel, room_type: v } })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double sharing</SelectItem>
                      <SelectItem value="triple">Triple sharing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Mess preference (Veg / Non-Veg)</Label><Input value={form.hostel.mess_preference ?? ""} onChange={(e) => upd({ hostel: { ...form.hostel, mess_preference: e.target.value } })} /></div>
                <div><Label>Medical conditions</Label><Input value={form.hostel.medical_conditions ?? ""} onChange={(e) => upd({ hostel: { ...form.hostel, medical_conditions: e.target.value } })} /></div>
                <div><Label>Dietary requirements</Label><Input value={form.hostel.dietary_requirements ?? ""} onChange={(e) => upd({ hostel: { ...form.hostel, dietary_requirements: e.target.value } })} /></div>
                <div><Label>Emergency contact name</Label><Input value={form.hostel.emergency_contact_name ?? ""} onChange={(e) => upd({ hostel: { ...form.hostel, emergency_contact_name: e.target.value } })} /></div>
                <div><Label>Emergency contact phone</Label><Input value={form.hostel.emergency_contact_phone ?? ""} onChange={(e) => upd({ hostel: { ...form.hostel, emergency_contact_phone: e.target.value } })} /></div>
                <div><Label>Relation</Label><Input value={form.hostel.emergency_contact_relation ?? ""} onChange={(e) => upd({ hostel: { ...form.hostel, emergency_contact_relation: e.target.value } })} /></div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                You selected no hostel requirement. Continue to the next step.
              </div>
            )
          )}

          {step === 7 && (
            <div className="space-y-3">
              {!form.id && <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">Complete Institution & Program (step 2) before uploading — that creates your draft.</div>}
              {docDefs.map((d) => {
                const uploaded = docs.find((x) => x.document_code === d.code);
                return (
                  <div key={d.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <div className="text-sm font-medium">{d.name} {d.required && <span className="text-destructive">*</span>}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.category} · {d.allowed_formats.join(", ")} · max {d.max_size_mb} MB
                        {uploaded && <> · <span className="text-accent">{uploaded.file_name}</span></>}
                      </div>
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" className="hidden"
                        accept={d.allowed_formats.map((f: string) => "." + f).join(",")}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(d, f); e.target.value = ""; }} />
                      <Button variant="outline" size="sm" type="button" asChild>
                        <span>{uploaded ? <><Upload className="mr-1 h-3 w-3" />Replace</> : <><FileUp className="mr-1 h-3 w-3" />Upload</>}</span>
                      </Button>
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
                I hereby declare that the information provided in this admission application is true and correct to the best of my knowledge. I understand that any false information may result in cancellation of admission.
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.declaration_accepted} onCheckedChange={(v) => upd({ declaration_accepted: !!v })} />
                I accept the declaration
              </label>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <div className="rounded-md border border-border p-4">
                <div className="text-sm font-medium">Application fee</div>
                <div className="text-3xl font-bold mt-1">₹500</div>
                <div className="mt-1 text-xs text-muted-foreground">One-time non-refundable application fee.</div>
              </div>
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
                Online payment via Razorpay will be enabled once the payment provider is fully configured. For now, please choose <b>Pay at Campus</b> — your application will be marked <b>Payment Pending</b> and the campus office will collect the fee.
              </div>
              <div className="text-xs text-muted-foreground">Selected: Pay at Campus</div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-3 text-sm">
              <div><b>Institution:</b> {institutionCategories.find((c) => c.id === form.sel_category)?.label}</div>
              <div><b>Branch:</b> {getBranchById(form.sel_branch)?.id} — {getBranchById(form.sel_branch)?.label}</div>
              <div><b>Course:</b> {getCourseById(form.sel_course)?.label}</div>
              <div><b>Campus:</b> {getCampusById(form.sel_campus)?.label}</div>
              <div><b>Student:</b> {form.student.first_name} {form.student.last_name}</div>
              <div><b>Hostel:</b> {form.hostel_required ? "Yes" : "No"}</div>
              <div><b>Documents uploaded:</b> {docs.length} of {docDefs.filter((d) => d.required).length} required</div>
              <div className="rounded-md border border-primary/30 bg-primary-soft p-3 text-sm text-primary">
                Please review carefully. Once you submit, critical fields are locked.
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={prev} disabled={step === 0}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => saveDraft(false)} disabled={saving || !form.academic_year_id}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Save draft
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next} disabled={!canProceed}>Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
              ) : (
                <Button onClick={() => saveDraft(true)} disabled={submitting || !form.declaration_accepted}>
                  {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Submit application
                </Button>
              )}
            </div>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
