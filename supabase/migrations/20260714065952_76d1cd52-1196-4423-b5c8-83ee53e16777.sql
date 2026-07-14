
-- Switch role-check helpers to SECURITY INVOKER to satisfy least-privilege.
-- Existing SELECT policies on user_roles/user_campus_scopes already let
-- authenticated users read their own rows (user_id = auth.uid()), which is
-- all these helpers need since they're invoked with auth.uid().

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_super_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('super_admin','admin','head_office'));
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('super_admin','admin','head_office','campus_operator',
                 'admission_staff','doc_verifier','accounts','hostel_admin'));
$$;

CREATE OR REPLACE FUNCTION public.has_campus_access(_user_id uuid, _campus_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.is_super_or_admin(_user_id) OR EXISTS(
    SELECT 1 FROM public.user_campus_scopes WHERE user_id = _user_id AND campus_id = _campus_id
  );
$$;
