-- Persist Sri Viswa local admission start-flow selection.
-- Supabase UUID master tables are not yet aligned with the Sri Viswa taxonomy, so the
-- application stores stable local codes/labels in this JSONB column.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS admission_selection JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS applications_admission_selection_gin
  ON public.applications USING GIN (admission_selection);

COMMENT ON COLUMN public.applications.admission_selection IS
  'Sri Viswa start-flow selection: category, branch, course, campus, form type, and hostel_required.';
