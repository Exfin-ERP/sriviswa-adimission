
CREATE POLICY "applicants upload own docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'application-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "applicants read own docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'application-documents' AND (
  (storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())
));

CREATE POLICY "applicants delete own docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'application-documents' AND (
  (storage.foldername(name))[1] = auth.uid()::text OR public.is_super_or_admin(auth.uid())
));

CREATE POLICY "admins manage all docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'application-documents' AND public.is_super_or_admin(auth.uid()));
