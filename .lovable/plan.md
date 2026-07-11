# Sri Viswa Admission Management Portal — v1

Production-grade admission portal with full RBAC (9 roles), Lovable Cloud backend, Razorpay payments, and Sri Viswa navy/emerald branding.

## What v1 ships

**Public applicant flow**
- Landing at `/apply` with logo + institution type selector (School / Intermediate / College / Degree / Hostel)
- Multi-step wizard (11 steps) with draft-save via `application_number` + phone OTP resume token
- Dynamic fields per institution type (school: class/TC; inter: group; degree: course/branch; hostel: room/medical)
- Document uploads to Supabase Storage (private bucket, signed URLs)
- Razorpay checkout at step 10; webhook confirms payment → status = Payment Completed
- Printable submission summary at `/apply/success/:appNo`

**Internal portal** (`/_authenticated/*`)
- Email/password + phone OTP login, role-aware redirect
- Left sidebar navigation, top filters (campus / institution / academic year / status)
- Role-specific dashboards (Super Admin sees all; Campus Operator sees own campus; Accounts sees payment queues; Hostel Admin sees hostel queue; etc.)
- Applications list with filters, search, export CSV
- Application detail: student/parent/academic/hostel tabs, documents panel with verify/reject/remark, status pipeline actions
- Master data admin (institution types, campuses, programs, branches, hostels, document definitions, academic years, quotas)
- Users & roles admin (assign roles, campus scopes)
- Audit log viewer

**Access control**
- `user_roles` table (separate from profiles), `has_role()` and `has_campus_access()` security-definer functions
- RLS on every table; server-side permission checks in every mutating server function
- Action-based permissions matrix enforced in DB policies + server fns

## Application status pipeline
Draft → Submitted → Under Review → Documents Pending ↔ Documents Verified → Payment Pending → Payment Completed → Approved → Admission Confirmed (or Rejected). Controlled transitions in `advance_status` server fn with audit log entry per change.

## Tech stack
TanStack Start + React 19, Tailwind v4 with Sri Viswa design tokens, shadcn components, Lovable Cloud (Postgres + Auth + Storage), Razorpay Checkout + webhook, Zod validation everywhere.

## Database schema (normalized)

```text
roles (enum: super_admin, admin, head_office, campus_operator,
       admission_staff, doc_verifier, accounts, hostel_admin, applicant)
profiles(id→auth.users, full_name, phone, email)
user_roles(user_id, role)
user_campus_scopes(user_id, campus_id)

institution_types(code, name)         -- school/inter/college/degree/hostel
academic_years(code, is_current)
campuses(id, code, name, address, institution_types[])
programs(id, campus_id, institution_type, name, code, duration)
branches(id, program_id, name, code, seats)
hostels(id, campus_id, name, gender, room_types jsonb, capacity)
quotas(code, name)
document_definitions(id, institution_type, category, name, required,
                     allowed_formats[], max_size_mb, stage)
fee_heads(id, code, name, institution_type)   -- future-ready

applications(id, application_number UNIQUE, institution_type, campus_id,
             program_id, branch_id, hostel_required, hostel_id,
             academic_year, quota, status, submitted_at, applicant_user_id,
             draft_token, created_at, updated_at)
application_student_details(application_id, ...)
application_parent_details(application_id, father_*, mother_*, guardian_*)
application_address_details(application_id, present_*, permanent_*)
application_academic_history(application_id, prev_school, class, marks,
                             tc_number, ...)
application_hostel_details(application_id, room_type, medical, dietary,
                           emergency_*)
application_documents(id, application_id, definition_id, file_path,
                      verification_status, remarks, verified_by, verified_at)
payments(id, application_id, amount, currency, status, provider)
payment_transactions(id, payment_id, gateway_ref, event, payload jsonb)
status_history(id, application_id, from_status, to_status, actor, note, at)
audit_logs(id, actor, action, entity, entity_id, meta jsonb, at)
```

Every public table gets explicit `GRANT`s; RLS enabled; policies use `has_role()` / `has_campus_access()`.

## Server surface

- Server functions (`createServerFn` + `requireSupabaseAuth`): create/save-draft/submit application, upload doc metadata, verify doc, advance status, list/search applications (scoped), master-data CRUD, user-role admin, dashboard summaries, CSV export
- Public server routes (`/api/public/*`): applicant draft resume via token, Razorpay webhook (HMAC verified), Razorpay order creation for applicant

## Design system

- Palette (oklch): deep navy primary `#1e3a8a`, emerald accent `#059669`, warm off-white surface, slate ink, muted sand for hover — extracted from the Sri Viswa logo
- Type: Inter / Plus Jakarta Sans pairing; strong headings, readable body
- Components: enterprise dashboard style — sidebar + top filter bar, card-based summary tiles, table with sticky header, tabbed detail views, wizard progress rail
- Print stylesheet for admission summary
- Fully mobile responsive; sidebar collapses to drawer

## Secrets required

- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (from the user)
- `RAZORPAY_WEBHOOK_SECRET` (user creates in Razorpay dashboard, pastes same value)

I will prompt for these after Cloud is enabled and DB is in place, before wiring live checkout.

## Build order (in this session)

1. Enable Lovable Cloud
2. Design tokens + logo asset + shell layout
3. DB migrations: enums, roles, master data, applications + children, documents, payments, audit
4. Auth pages, `_authenticated` layout already managed
5. Applicant wizard end-to-end with draft save + document upload
6. Internal dashboards + applications list/detail + verification + status pipeline
7. Master data + user/role admin + audit log viewer
8. Razorpay order creation + webhook + status coupling
9. Seed a Super Admin + demo campuses/programs/hostels + document definitions

## Out of scope for v1 (architected for later)

- Tuition/books/exam/transport fee collection modules (schema hooks via `fee_heads` and `payments.purpose`)
- SMS/email transactional notifications (structure ready; add later)
- Bulk import of applicants; advanced report builder; SSO/SAML

Given the size, expect this to land across multiple large edits in this turn.
