
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS admission_selection JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS applications_admission_selection_gin
  ON public.applications USING GIN (admission_selection);

ALTER TABLE public.application_hostel_details
  ADD COLUMN IF NOT EXISTS selected_campus_label TEXT,
  ADD COLUMN IF NOT EXISTS parent_consent BOOLEAN NOT NULL DEFAULT false;
