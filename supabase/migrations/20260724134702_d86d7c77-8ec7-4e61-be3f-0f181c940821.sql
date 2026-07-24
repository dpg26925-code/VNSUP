
CREATE POLICY "vnsupplier public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'vnsupplier');

CREATE POLICY "vnsupplier authenticated upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vnsupplier' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "vnsupplier owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'vnsupplier' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'vnsupplier' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "vnsupplier owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vnsupplier' AND auth.uid()::text = (storage.foldername(name))[1]);
