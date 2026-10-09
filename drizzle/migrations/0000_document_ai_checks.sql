ALTER TABLE public.application_documents
  ADD COLUMN IF NOT EXISTS ai_status text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_extracted jsonb,
  ADD COLUMN IF NOT EXISTS ai_flags jsonb,
  ADD COLUMN IF NOT EXISTS ai_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_checked_by uuid;