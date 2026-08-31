/*
# Fix reels-media storage: scope DELETE/UPDATE to file owner

## Summary
The reels-media bucket currently allows any authenticated user to delete any file.
This migration replaces the DELETE and UPDATE policies to ensure users can only
modify/delete files within their own folder path (email-based folder structure).

## Security changes:
- DELETE policy: only the file owner (determined by path prefix) can delete
- UPDATE policy: only the file owner can update/overwrite
- INSERT policy: users can only upload to their own folder
- SELECT remains public (the bucket is public for playback)
*/

-- Fix INSERT: users must upload to a path starting with their email
DROP POLICY IF EXISTS "auth_insert_reels" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload reels" ON storage.objects;
CREATE POLICY "auth_insert_reels" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'reels-media'
    AND (storage.foldername(name))[1] = auth.jwt() ->> 'email'
  );

-- Fix UPDATE: users can only update their own files
DROP POLICY IF EXISTS "auth_update_reels" ON storage.objects;
CREATE POLICY "auth_update_reels" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'reels-media'
    AND (storage.foldername(name))[1] = auth.jwt() ->> 'email'
  )
  WITH CHECK (
    bucket_id = 'reels-media'
    AND (storage.foldername(name))[1] = auth.jwt() ->> 'email'
  );

-- Fix DELETE: users can only delete their own files
DROP POLICY IF EXISTS "auth_delete_reels" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete reels" ON storage.objects;
CREATE POLICY "auth_delete_reels" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'reels-media'
    AND (storage.foldername(name))[1] = auth.jwt() ->> 'email'
  );
