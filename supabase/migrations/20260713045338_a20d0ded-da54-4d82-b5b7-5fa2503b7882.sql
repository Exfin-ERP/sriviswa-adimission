
-- 1. Fix mutable search_path on remaining functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.next_application_number()
RETURNS text LANGUAGE sql SET search_path = public
AS $$ SELECT 'SVI' || to_char(now(), 'YY') || lpad(nextval('public.application_number_seq')::text, 6, '0'); $$;

-- 2. Lock down SECURITY DEFINER functions from anon/public.
-- handle_new_user: trigger-only, revoke from all app roles.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Role/scope helpers: needed by RLS policies -> keep authenticated EXECUTE, revoke anon/public.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_or_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_campus_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_or_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_campus_access(uuid, uuid) TO authenticated;

-- 3. Tighten applications PII exposure: remove campus_id IS NULL staff bypass
DROP POLICY IF EXISTS "applicant sees own applications" ON public.applications;
CREATE POLICY "applicant sees own applications" ON public.applications
FOR SELECT TO authenticated
USING (
  applicant_user_id = auth.uid()
  OR public.is_super_or_admin(auth.uid())
  OR (public.is_staff(auth.uid()) AND campus_id IS NOT NULL AND public.has_campus_access(auth.uid(), campus_id))
);

DROP POLICY IF EXISTS "applicant/staff updates application" ON public.applications;
CREATE POLICY "applicant/staff updates application" ON public.applications
FOR UPDATE TO authenticated
USING (
  (applicant_user_id = auth.uid() AND status = 'draft'::application_status)
  OR public.is_super_or_admin(auth.uid())
  OR (public.is_staff(auth.uid()) AND campus_id IS NOT NULL AND public.has_campus_access(auth.uid(), campus_id))
);

-- 4. Reference tables: keep public catalog readable (public apply flow needs them) but
--    remove sensitive contact fields on campuses from anon exposure via column privileges.
REVOKE SELECT ON public.campuses FROM anon;
GRANT SELECT (id, code, name, address, city, state, supported_types, is_active, created_at, updated_at)
  ON public.campuses TO anon;
