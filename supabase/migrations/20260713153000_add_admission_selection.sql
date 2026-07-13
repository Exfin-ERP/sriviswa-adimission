-- Persist Sri Viswa local admission start-flow selection.
-- Supabase UUID master tables are not yet aligned with the Sri Viswa taxonomy, so the
-- application stores stable local codes/labels in this JSONB column.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS admission_selection JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS applications_admission_selection_gin
  ON public.applications USING GIN (admission_selection);

COMMENT ON COLUMN public.applications.admission_selection IS
  'Sri Viswa start-flow selection: category, branch, course, campus, form type, and hostel_required.';

-- Hostel flow no longer depends on Supabase hostel UUIDs during MVP. These columns
-- keep the selected campus visible and capture parent consent without breaking the
-- existing application_hostel_details upsert.
ALTER TABLE public.application_hostel_details
  ADD COLUMN IF NOT EXISTS selected_campus_label TEXT,
  ADD COLUMN IF NOT EXISTS parent_consent BOOLEAN NOT NULL DEFAULT false;
