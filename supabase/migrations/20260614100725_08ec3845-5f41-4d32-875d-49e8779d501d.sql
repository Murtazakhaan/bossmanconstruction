
CREATE POLICY "Authenticated can view material photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'material-photos');

CREATE POLICY "Contractors upload their own material photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'material-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Contractors delete their own material photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'material-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
