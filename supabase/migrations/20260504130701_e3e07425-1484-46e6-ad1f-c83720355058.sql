
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Restrict listing of storage objects: allow only individual file reads via known path
DROP POLICY IF EXISTS "Public read park-assets" ON storage.objects;
CREATE POLICY "Public read park-assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'park-assets');
