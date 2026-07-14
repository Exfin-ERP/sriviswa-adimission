// Sri Viswa Admission master data (local source of truth for the Start Admission flow).
// IDs are stable codes. Labels can change without breaking selections.

export type InstitutionCategoryId = "jr_college" | "degree_college" | "co_schools";
export type FormType = "intermediate" | "degree" | "school";

export type InstitutionCategory = {
  id: InstitutionCategoryId;
  label: string;
  formType: FormType;
};

export const institutionCategories: InstitutionCategory[] = [
  { id: "jr_college", label: "Sri Viswa Jr College", formType: "intermediate" },
  { id: "degree_college", label: "Sri Viswa Degree College", formType: "degree" },
  { id: "co_schools", label: "Sri Viswa Co Schools", formType: "school" },
];

export type Branch = {
  id: string; // stable code, e.g. "SVJR"
  label: string;
  categoryId: InstitutionCategoryId;
  kind: "day_scholar" | "hostel" | "mixed";
  campusIds: string[]; // allowed campus ids for this branch
};

export const branches: Branch[] = [
  // ---- Jr College ----
  { id: "SVJR", label: "SRI VISWA IIT & MEDICAL ACADEMY", categoryId: "jr_college", kind: "mixed",
    campusIds: ["ds_main", "ds_anr", "ds_revolt", "mess", "dgm", "gh_revala", "gh_midhlapur", "gh_happy3", "bh_harbour", "bh_lakhmi", "bh_5", "bipc_bh", "bipc_gh_lt", "bipc_gh_spark", "bipc_gh_sivasivani"] },
  { id: "SVJRB", label: "SRI VISWA IIT & MEDICAL ACADEMY (B)", categoryId: "jr_college", kind: "hostel",
    campusIds: ["bh_harbour", "bh_lakhmi", "bh_5", "bipc_bh", "mess", "dgm"] },
  { id: "SVJRG", label: "SRI VISWA IIT & MEDICAL ACADEMY (G)", categoryId: "jr_college", kind: "hostel",
    campusIds: ["gh_revala", "gh_midhlapur", "gh_happy3", "bipc_gh_lt", "bipc_gh_spark", "bipc_gh_sivasivani", "mess", "dgm"] },
  { id: "SVJRKMP", label: "SRI VISWA IIT & MEDICAL ACADEMY KMP", categoryId: "jr_college", kind: "mixed",
    campusIds: ["ds_main", "bh_harbour", "gh_revala", "mess"] },

  // ---- Co Schools ----
  { id: "SVCSDB", label: "SRI VISWA CO School Day Scholar (Bs)", categoryId: "co_schools", kind: "day_scholar",
    campusIds: ["school_ds", "school_ds_main"] },
  { id: "SVCSDS", label: "SRI VISWA CO School Day Scholar (Sontyam)", categoryId: "co_schools", kind: "day_scholar",
    campusIds: ["school_ds", "school_ds_main"] },
  { id: "SVCSDBYP", label: "SRI VISWA CO School Day Scholar (Boyapalem)", categoryId: "co_schools", kind: "day_scholar",
    campusIds: ["school_ds", "school_ds_main"] },
  { id: "SVCSDKMP", label: "SRI VISWA CO School Day Scholar (KMP)", categoryId: "co_schools", kind: "day_scholar",
    campusIds: ["school_ds", "school_ds_main"] },
  { id: "SVCSHS", label: "SRI VISWA CO School Hostler (Sontyam)", categoryId: "co_schools", kind: "hostel",
    campusIds: ["school_hostel", "mess"] },
  { id: "SVCSTV", label: "SRI VISWA CO School Hostler (TV)", categoryId: "co_schools", kind: "hostel",
    campusIds: ["school_hostel", "mess"] },
  { id: "SVCSHBYP", label: "SRI VISWA CO School Hostler (Boyapalem)", categoryId: "co_schools", kind: "hostel",
    campusIds: ["school_hostel", "mess"] },

  // ---- Degree ----
  // NOTE: "SVDEG" is a TEMPORARY internal branch code for the Degree College.
  // Replace with the official Sri Viswa Degree College branch code once confirmed by admin.
  { id: "SVDEG", label: "SRI VISWA DEGREE COLLEGE", categoryId: "degree_college", kind: "day_scholar",
    campusIds: ["degree_campus"] },
];

export type Course = {
  id: string;   // stable code
  label: string;
  categoryId: InstitutionCategoryId;
  branchIds?: string[]; // optional restriction
  tags?: Array<"bipc" | "mpc" | "neet" | "spark" | "longterm" | "mains" | "advance" | "co">;
};

export const courses: Course[] = [
  // Jr College
  { id: "I_MPC",              label: "I-MPC",              categoryId: "jr_college", tags: ["mpc"] },
  { id: "II_MPC",             label: "II-MPC",             categoryId: "jr_college", tags: ["mpc"] },
  { id: "I_BIPC",             label: "I-BIPC",             categoryId: "jr_college", tags: ["bipc"] },
  { id: "II_BIPC",            label: "II-BIPC",            categoryId: "jr_college", tags: ["bipc"] },
  { id: "I_MPC_MAINS",        label: "I-MPC-MAINS",        categoryId: "jr_college", tags: ["mpc", "mains"] },
  { id: "I_MPC_ADVANCE",      label: "I-MPC-ADVANCE",      categoryId: "jr_college", tags: ["mpc", "advance"] },
  { id: "NEET_LT_SPARK",      label: "NEET LONGTERM Spark",categoryId: "jr_college", tags: ["neet", "longterm", "spark", "bipc"] },
  { id: "I_MPC_CO",           label: "I-MPC-CO",           categoryId: "jr_college", tags: ["mpc", "co"] },
  { id: "I_BIPC_CO",          label: "I-BIPC-CO",          categoryId: "jr_college", tags: ["bipc", "co"] },
  { id: "II_MPC_MAINS",       label: "II-MPC-MAINS",       categoryId: "jr_college", tags: ["mpc", "mains"] },
  { id: "II_MPC_ADVANCE",     label: "II-MPC-ADVANCE",     categoryId: "jr_college", tags: ["mpc", "advance"] },
  { id: "II_MPC_CO",          label: "II-MPC-CO",          categoryId: "jr_college", tags: ["mpc", "co"] },
  { id: "II_BIPC_CO",         label: "II-BIPC-CO",         categoryId: "jr_college", tags: ["bipc", "co"] },
  { id: "NEET_LT_CO",         label: "NEET LONGTERM CO",   categoryId: "jr_college", tags: ["neet", "longterm", "co", "bipc"] },

  // Schools
  { id: "CLS_3",  label: "III-CLASS",  categoryId: "co_schools" },
  { id: "CLS_4",  label: "IV-CLASS",   categoryId: "co_schools" },
  { id: "CLS_5",  label: "V-CLASS",    categoryId: "co_schools" },
  { id: "CLS_6",  label: "VI-CLASS",   categoryId: "co_schools" },
  { id: "CLS_7",  label: "VII-CLASS",  categoryId: "co_schools" },
  { id: "CLS_8",  label: "VIII-CLASS", categoryId: "co_schools" },
  { id: "CLS_9",  label: "IX-CLASS",   categoryId: "co_schools" },
  { id: "CLS_10", label: "X-CLASS",    categoryId: "co_schools" },

  // Degree
  { id: "DEG_PLUS_ONE",  label: "Plus One",                categoryId: "degree_college" },
  { id: "DEG_PLUS_TWO",  label: "Plus Two",                categoryId: "degree_college" },
  { id: "DEG_BSC_DS",    label: "I-BSc Data Science",      categoryId: "degree_college" },
  { id: "DEG_BSC_AI",    label: "I-BSc AI",                categoryId: "degree_college" },
  { id: "DEG_BSC_CS",    label: "I-BSc Computer Science",  categoryId: "degree_college" },
  { id: "DEG_BSC_STAT",  label: "I-BSc Statistics",        categoryId: "degree_college" },
  { id: "DEG_BSC_BT",    label: "I-BSc BioTechnology",     categoryId: "degree_college" },
  { id: "DEG_BSC_FST",   label: "I-BSc FS&T",              categoryId: "degree_college" },
  { id: "DEG_BBA_HM",    label: "I-BBA Hotel Management",  categoryId: "degree_college" },
  { id: "DEG_BBA_HT",    label: "I-BBA Hospitality & Tourism", categoryId: "degree_college" },
  { id: "DEG_BBA_BA",    label: "I-BBA Business Admin",    categoryId: "degree_college" },
  { id: "DEG_BCOM_COMP", label: "I-BCom Computers",        categoryId: "degree_college" },
];

export type Campus = {
  id: string; // stable id
  label: string;
  kind: "day_scholar" | "hostel_boys" | "hostel_girls" | "hostel_bipc_boys" | "hostel_bipc_girls" | "school_ds" | "school_hostel" | "degree" | "support";
};

export const campuses: Campus[] = [
  // Jr college day scholar
  { id: "ds_main",   label: "Day Scholar (Main Campus)",              kind: "day_scholar" },
  { id: "ds_anr",    label: "Day Scholar Two (ANR Campus)",           kind: "day_scholar" },
  { id: "ds_revolt", label: "Day Scholar Three (Revolt Campus)",      kind: "day_scholar" },
  // Support
  { id: "mess",      label: "Mess",                                    kind: "support" },
  { id: "dgm",       label: "DGM",                                     kind: "support" },
  // Girls hostels
  { id: "gh_revala",     label: "Girls Hostel One (Revala Palme)",        kind: "hostel_girls" },
  { id: "gh_midhlapur",  label: "Girls Hostel Two (Midhlapur Colony)",    kind: "hostel_girls" },
  { id: "gh_happy3",     label: "Girls Hostel Three (Happy Life)",        kind: "hostel_girls" },
  // Boys hostels
  { id: "bh_harbour",    label: "Boys Hostel Three (Harbour Campus)",     kind: "hostel_boys" },
  { id: "bh_lakhmi",     label: "Boys Hostel Four (Lakshminarayana)",     kind: "hostel_boys" },
  { id: "bh_5",          label: "Boys Hostel 5",                          kind: "hostel_boys" },
  // BIPC hostels
  { id: "bipc_bh",             label: "BIPC Boys Hostel",                      kind: "hostel_bipc_boys" },
  { id: "bipc_gh_lt",          label: "BIPC Girls Hostel One (LT Girls Campus)",   kind: "hostel_bipc_girls" },
  { id: "bipc_gh_spark",       label: "BIPC Girls Hostel Two (LT Spark Campus)",   kind: "hostel_bipc_girls" },
  { id: "bipc_gh_sivasivani",  label: "BIPC Girls Hostel Three (Siva Sivani)",     kind: "hostel_bipc_girls" },
  // Schools
  { id: "school_ds",       label: "School Day Scholar",                    kind: "school_ds" },
  { id: "school_ds_main",  label: "School Day Scholar (Main Campus)",      kind: "school_ds" },
  { id: "school_hostel",   label: "School Hostler",                        kind: "school_hostel" },
  // Degree
  { id: "degree_campus",   label: "Degree Campus",                         kind: "degree" },
];

const CAMPUS_BY_ID = new Map(campuses.map((c) => [c.id, c] as const));
const BRANCH_BY_ID = new Map(branches.map((b) => [b.id, b] as const));
const COURSE_BY_ID = new Map(courses.map((c) => [c.id, c] as const));

export function getBranchesByInstitutionCategory(categoryId: InstitutionCategoryId | string | undefined): Branch[] {
  if (!categoryId) return [];
  return branches.filter((b) => b.categoryId === categoryId);
}

export function getCoursesByCategoryAndBranch(
  categoryId: InstitutionCategoryId | string | undefined,
  branchId?: string,
): Course[] {
  if (!categoryId) return [];
  return courses.filter((c) => {
    if (c.categoryId !== categoryId) return false;
    if (branchId && c.branchIds && !c.branchIds.includes(branchId)) return false;
    return true;
  });
}

export function getCampusesByBranchAndCourse(branchId?: string, courseId?: string): Campus[] {
  if (!branchId) return [];
  const branch = BRANCH_BY_ID.get(branchId);
  if (!branch) return [];
  let allowed = branch.campusIds.map((id) => CAMPUS_BY_ID.get(id)!).filter(Boolean);

  const course = courseId ? COURSE_BY_ID.get(courseId) : undefined;
  if (course) {
    const isBipc = !!course.tags?.includes("bipc");
    const isMpc = !!course.tags?.includes("mpc");
    // For BIPC courses, prefer BIPC-specific hostels; for MPC hide BIPC-only hostels.
    if (isMpc && !isBipc) {
      allowed = allowed.filter((c) => c.kind !== "hostel_bipc_boys" && c.kind !== "hostel_bipc_girls");
    }
    if (isBipc) {
      // Keep regular boys/girls too — some branches list them; BIPC-tagged appear naturally.
    }
  }

  // Branch-kind narrowing: if branch is hostel-only, drop pure day-scholar campuses (support stays).
  if (branch.kind === "hostel") {
    allowed = allowed.filter((c) => c.kind !== "day_scholar" && c.kind !== "school_ds");
  }
  if (branch.kind === "day_scholar") {
    allowed = allowed.filter(
      (c) => c.kind === "day_scholar" || c.kind === "school_ds" || c.kind === "degree" || c.kind === "support",
    );
  }
  return allowed;
}

export function getAdmissionFormType(
  categoryId: InstitutionCategoryId | string | undefined,
  _branchId?: string,
  _courseId?: string,
  _campusId?: string,
): FormType | undefined {
  const cat = institutionCategories.find((c) => c.id === categoryId);
  return cat?.formType;
}

export function isHostelBranch(branchId?: string): boolean {
  if (!branchId) return false;
  const b = BRANCH_BY_ID.get(branchId);
  return b?.kind === "hostel";
}

export function isDayScholarBranch(branchId?: string): boolean {
  if (!branchId) return false;
  const b = BRANCH_BY_ID.get(branchId);
  return b?.kind === "day_scholar";
}

export function isBipcCourse(courseId?: string): boolean {
  if (!courseId) return false;
  return !!COURSE_BY_ID.get(courseId)?.tags?.includes("bipc");
}

export function isDegreeCourse(courseId?: string): boolean {
  if (!courseId) return false;
  return COURSE_BY_ID.get(courseId)?.categoryId === "degree_college";
}

export function isHostelCampus(campusId?: string): boolean {
  if (!campusId) return false;
  const c = CAMPUS_BY_ID.get(campusId);
  if (!c) return false;
  return c.kind.startsWith("hostel") || c.kind === "school_hostel";
}

export function getCampusById(id?: string) { return id ? CAMPUS_BY_ID.get(id) : undefined; }
export function getBranchById(id?: string) { return id ? BRANCH_BY_ID.get(id) : undefined; }
export function getCourseById(id?: string) { return id ? COURSE_BY_ID.get(id) : undefined; }
