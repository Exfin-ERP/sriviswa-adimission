
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM (
  'super_admin','admin','head_office','campus_operator',
  'admission_staff','doc_verifier','accounts','hostel_admin','applicant'
);

CREATE TYPE public.institution_type AS ENUM ('school','intermediate','college','degree','hostel');

CREATE TYPE public.application_status AS ENUM (
  'draft','submitted','under_review','documents_pending','documents_verified',
  'payment_pending','payment_completed','approved','rejected','admission_confirmed'
);

CREATE TYPE public.doc_verification_status AS ENUM ('pending','verified','rejected','reupload_required');
CREATE TYPE public.payment_status AS ENUM ('initiated','pending','paid','failed','refunded');
CREATE TYPE public.gender AS ENUM ('male','female','other');

-- ========== updated_at helper ==========
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, full_name, email, phone)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_super_or_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('super_admin','admin','head_office'));
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id
    AND role IN ('super_admin','admin','head_office','campus_operator',
                 'admission_staff','doc_verifier','accounts','hostel_admin'));
$$;

-- ========== MASTER DATA ==========
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academic_years TO anon, authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read academic_years" ON public.academic_years FOR SELECT USING (true);
CREATE POLICY "admins manage academic_years" ON public.academic_years FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE TABLE public.campuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  supported_types institution_type[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campuses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campuses TO authenticated;
GRANT ALL ON public.campuses TO service_role;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read campuses" ON public.campuses FOR SELECT USING (true);
CREATE POLICY "admins manage campuses" ON public.campuses FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));
CREATE TRIGGER campuses_updated_at BEFORE UPDATE ON public.campuses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_campus_scopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, campus_id)
);
GRANT SELECT ON public.user_campus_scopes TO authenticated;
GRANT ALL ON public.user_campus_scopes TO service_role;
ALTER TABLE public.user_campus_scopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own scopes" ON public.user_campus_scopes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_or_admin(auth.uid()));
CREATE POLICY "admins manage scopes" ON public.user_campus_scopes FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "staff view roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_or_admin(auth.uid()));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE POLICY "users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_campus_access(_user_id UUID, _campus_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_or_admin(_user_id) OR EXISTS(
    SELECT 1 FROM public.user_campus_scopes WHERE user_id = _user_id AND campus_id = _campus_id
  );
$$;

CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  institution_type institution_type NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  duration_years NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campus_id, institution_type, code)
);
GRANT SELECT ON public.programs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read programs" ON public.programs FOR SELECT USING (true);
CREATE POLICY "admins manage programs" ON public.programs FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  seats INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(program_id, code)
);
GRANT SELECT ON public.branches TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "admins manage branches" ON public.branches FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE TABLE public.hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender gender NOT NULL,
  room_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  capacity INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.hostels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hostels TO authenticated;
GRANT ALL ON public.hostels TO service_role;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read hostels" ON public.hostels FOR SELECT USING (true);
CREATE POLICY "admins manage hostels" ON public.hostels FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE TABLE public.quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);
GRANT SELECT ON public.quotas TO anon, authenticated;
GRANT ALL ON public.quotas TO service_role;
ALTER TABLE public.quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read quotas" ON public.quotas FOR SELECT USING (true);
CREATE POLICY "admins manage quotas" ON public.quotas FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE TABLE public.document_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_type institution_type NOT NULL,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  allowed_formats TEXT[] NOT NULL DEFAULT ARRAY['pdf','jpg','jpeg','png'],
  max_size_mb INTEGER NOT NULL DEFAULT 5,
  stage TEXT NOT NULL DEFAULT 'application',
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(institution_type, code)
);
GRANT SELECT ON public.document_definitions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.document_definitions TO authenticated;
GRANT ALL ON public.document_definitions TO service_role;
ALTER TABLE public.document_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read doc defs" ON public.document_definitions FOR SELECT USING (true);
CREATE POLICY "admins manage doc defs" ON public.document_definitions FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

CREATE TABLE public.fee_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  institution_type institution_type,
  is_active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.fee_heads TO authenticated;
GRANT ALL ON public.fee_heads TO service_role;
ALTER TABLE public.fee_heads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read fee heads" ON public.fee_heads FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "admins manage fee heads" ON public.fee_heads FOR ALL TO authenticated
  USING (public.is_super_or_admin(auth.uid())) WITH CHECK (public.is_super_or_admin(auth.uid()));

-- ========== APPLICATIONS ==========
CREATE SEQUENCE public.application_number_seq START 100001;

CREATE OR REPLACE FUNCTION public.next_application_number()
RETURNS TEXT LANGUAGE sql VOLATILE AS $$
  SELECT 'SVI' || to_char(now(), 'YY') || lpad(nextval('public.application_number_seq')::text, 6, '0');
$$;

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL UNIQUE DEFAULT public.next_application_number(),
  institution_type institution_type NOT NULL,
  campus_id UUID REFERENCES public.campuses(id),
  program_id UUID REFERENCES public.programs(id),
  branch_id UUID REFERENCES public.branches(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  quota_id UUID REFERENCES public.quotas(id),
  hostel_required BOOLEAN NOT NULL DEFAULT false,
  hostel_id UUID REFERENCES public.hostels(id),
  status application_status NOT NULL DEFAULT 'draft',
  applicant_user_id UUID REFERENCES auth.users(id),
  applicant_email TEXT,
  applicant_phone TEXT,
  draft_token TEXT UNIQUE,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ON public.applications(status);
CREATE INDEX ON public.applications(campus_id);
CREATE INDEX ON public.applications(institution_type);

CREATE POLICY "applicant sees own applications" ON public.applications FOR SELECT TO authenticated
  USING (
    applicant_user_id = auth.uid()
    OR public.is_super_or_admin(auth.uid())
    OR (public.is_staff(auth.uid()) AND (campus_id IS NULL OR public.has_campus_access(auth.uid(), campus_id)))
  );
CREATE POLICY "applicant inserts own application" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (applicant_user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "applicant/staff updates application" ON public.applications FOR UPDATE TO authenticated
  USING (
    (applicant_user_id = auth.uid() AND status = 'draft')
    OR public.is_super_or_admin(auth.uid())
    OR (public.is_staff(auth.uid()) AND (campus_id IS NULL OR public.has_campus_access(auth.uid(), campus_id)))
  );

-- Child tables
CREATE TABLE public.application_student_details (
  application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  first_name TEXT, middle_name TEXT, last_name TEXT,
  gender gender, date_of_birth DATE, blood_group TEXT,
  nationality TEXT, religion TEXT, category TEXT,
  aadhaar TEXT, mother_tongue TEXT,
  photo_path TEXT, signature_path TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.application_parent_details (
  application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  father_name TEXT, father_occupation TEXT, father_phone TEXT, father_email TEXT, father_income NUMERIC,
  mother_name TEXT, mother_occupation TEXT, mother_phone TEXT, mother_email TEXT,
  guardian_name TEXT, guardian_relation TEXT, guardian_phone TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.application_address_details (
  application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  present_line1 TEXT, present_line2 TEXT, present_city TEXT, present_state TEXT, present_pincode TEXT,
  permanent_line1 TEXT, permanent_line2 TEXT, permanent_city TEXT, permanent_state TEXT, permanent_pincode TEXT,
  same_as_present BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.application_academic_history (
  application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  previous_school TEXT, previous_board TEXT, previous_class TEXT,
  previous_year TEXT, previous_marks_percent NUMERIC,
  tc_number TEXT, migration_number TEXT,
  applying_for_class TEXT, stream TEXT,
  remarks TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.application_hostel_details (
  application_id UUID PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  room_type TEXT, mess_preference TEXT,
  medical_conditions TEXT, dietary_requirements TEXT,
  emergency_contact_name TEXT, emergency_contact_phone TEXT, emergency_contact_relation TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'application_student_details','application_parent_details','application_address_details',
    'application_academic_history','application_hostel_details'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$CREATE POLICY "app child read" ON public.%I FOR SELECT TO authenticated USING (
      EXISTS(SELECT 1 FROM public.applications a WHERE a.id = %I.application_id AND (
        a.applicant_user_id = auth.uid() OR public.is_super_or_admin(auth.uid())
        OR (public.is_staff(auth.uid()) AND (a.campus_id IS NULL OR public.has_campus_access(auth.uid(), a.campus_id)))
      )));$f$, t, t);
    EXECUTE format($f$CREATE POLICY "app child write" ON public.%I FOR ALL TO authenticated USING (
      EXISTS(SELECT 1 FROM public.applications a WHERE a.id = %I.application_id AND (
        (a.applicant_user_id = auth.uid() AND a.status = 'draft')
        OR public.is_super_or_admin(auth.uid())
        OR (public.is_staff(auth.uid()) AND (a.campus_id IS NULL OR public.has_campus_access(auth.uid(), a.campus_id)))
      ))) WITH CHECK (
      EXISTS(SELECT 1 FROM public.applications a WHERE a.id = %I.application_id AND (
        (a.applicant_user_id = auth.uid() AND a.status = 'draft')
        OR public.is_super_or_admin(auth.uid())
        OR (public.is_staff(auth.uid()) AND (a.campus_id IS NULL OR public.has_campus_access(auth.uid(), a.campus_id)))
      )));$f$, t, t, t);
  END LOOP;
END $$;

-- ========== DOCUMENTS ==========
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  definition_id UUID REFERENCES public.document_definitions(id),
  document_code TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  verification_status doc_verification_status NOT NULL DEFAULT 'pending',
  remarks TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs read" ON public.application_documents FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.applications a WHERE a.id = application_id AND (
    a.applicant_user_id = auth.uid() OR public.is_super_or_admin(auth.uid())
    OR (public.is_staff(auth.uid()) AND (a.campus_id IS NULL OR public.has_campus_access(auth.uid(), a.campus_id)))
  )));
CREATE POLICY "docs insert" ON public.application_documents FOR INSERT TO authenticated WITH CHECK (
  EXISTS(SELECT 1 FROM public.applications a WHERE a.id = application_id AND (
    a.applicant_user_id = auth.uid() OR public.is_staff(auth.uid())
  )));
CREATE POLICY "docs update" ON public.application_documents FOR UPDATE TO authenticated USING (
  EXISTS(SELECT 1 FROM public.applications a WHERE a.id = application_id AND (
    (a.applicant_user_id = auth.uid() AND a.status = 'draft')
    OR public.is_super_or_admin(auth.uid())
    OR (public.is_staff(auth.uid()) AND (a.campus_id IS NULL OR public.has_campus_access(auth.uid(), a.campus_id)))
  )));
CREATE POLICY "docs delete own draft" ON public.application_documents FOR DELETE TO authenticated USING (
  EXISTS(SELECT 1 FROM public.applications a WHERE a.id = application_id AND (
    (a.applicant_user_id = auth.uid() AND a.status = 'draft')
    OR public.is_super_or_admin(auth.uid())
  )));

-- ========== PAYMENTS ==========
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  fee_head_id UUID REFERENCES public.fee_heads(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  status payment_status NOT NULL DEFAULT 'initiated',
  purpose TEXT NOT NULL DEFAULT 'admission_fee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.applications a WHERE a.id = application_id AND (
    a.applicant_user_id = auth.uid() OR public.is_super_or_admin(auth.uid())
    OR (public.is_staff(auth.uid()) AND (a.campus_id IS NULL OR public.has_campus_access(auth.uid(), a.campus_id)))
  )));

CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  gateway_ref TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment tx read" ON public.payment_transactions FOR SELECT TO authenticated
  USING (public.is_super_or_admin(auth.uid()) OR EXISTS(
    SELECT 1 FROM public.payments p JOIN public.applications a ON a.id = p.application_id
    WHERE p.id = payment_id AND (
      a.applicant_user_id = auth.uid()
      OR (public.is_staff(auth.uid()) AND (a.campus_id IS NULL OR public.has_campus_access(auth.uid(), a.campus_id)))
    )));

-- ========== STATUS + AUDIT ==========
CREATE TABLE public.status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_status application_status,
  to_status application_status NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.status_history TO authenticated;
GRANT ALL ON public.status_history TO service_role;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "status hist read" ON public.status_history FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.applications a WHERE a.id = application_id AND (
    a.applicant_user_id = auth.uid() OR public.is_super_or_admin(auth.uid())
    OR (public.is_staff(auth.uid()) AND (a.campus_id IS NULL OR public.has_campus_access(auth.uid(), a.campus_id)))
  )));

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read staff" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_super_or_admin(auth.uid()));
CREATE POLICY "audit insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE INDEX ON public.audit_logs(created_at DESC);
CREATE INDEX ON public.audit_logs(entity, entity_id);
