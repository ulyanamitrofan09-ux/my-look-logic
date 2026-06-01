
-- Restrict storage listing to owners
DROP POLICY IF EXISTS "wi storage select" ON storage.objects;
CREATE POLICY "wi storage select own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'wardrobe-items' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "wi storage select public read" ON storage.objects FOR SELECT TO anon
  USING (false);

-- Lock down the trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
