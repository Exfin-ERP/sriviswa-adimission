export type AppRole =
  | "super_admin"
  | "admin"
  | "head_office"
  | "campus_operator"
  | "admission_staff"
  | "doc_verifier"
  | "accounts"
  | "hostel_admin"
  | "applicant";

export const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  head_office: "Head Office",
  campus_operator: "Campus Operator",
  admission_staff: "Admission Staff",
  doc_verifier: "Document Verifier",
  accounts: "Accounts",
  hostel_admin: "Hostel Admin",
  applicant: "Applicant",
};

export const STAFF_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "head_office",
  "campus_operator",
  "admission_staff",
  "doc_verifier",
  "accounts",
  "hostel_admin",
];

export const INSTITUTION_TYPES = [
  { value: "school", label: "School" },
  { value: "intermediate", label: "Intermediate" },
  { value: "college", label: "College" },
  { value: "degree", label: "Degree" },
  { value: "hostel", label: "Hostel" },
] as const;

export type InstitutionType = (typeof INSTITUTION_TYPES)[number]["value"];

export const APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "documents_pending",
  "documents_verified",
  "payment_pending",
  "payment_completed",
  "approved",
  "rejected",
  "admission_confirmed",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  documents_pending: "Documents Pending",
  documents_verified: "Documents Verified",
  payment_pending: "Payment Pending",
  payment_completed: "Payment Completed",
  approved: "Approved",
  rejected: "Rejected",
  admission_confirmed: "Admission Confirmed",
};

export const STATUS_TONE: Record<ApplicationStatus, "muted" | "info" | "warning" | "success" | "destructive"> = {
  draft: "muted",
  submitted: "info",
  under_review: "info",
  documents_pending: "warning",
  documents_verified: "info",
  payment_pending: "warning",
  payment_completed: "info",
  approved: "success",
  rejected: "destructive",
  admission_confirmed: "success",
};
