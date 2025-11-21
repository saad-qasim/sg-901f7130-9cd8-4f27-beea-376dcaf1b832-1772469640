-- Enable RLS on the brand-logos bucket (if not already enabled)
-- This is already done, but we need to add policies

-- Policy 1: Allow anyone to upload files to brand-logos bucket
CREATE POLICY "Allow public uploads to brand-logos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'brand-logos');

-- Policy 2: Allow anyone to view files in brand-logos bucket
CREATE POLICY "Allow public reads from brand-logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'brand-logos');

-- Policy 3: Allow anyone to update files in brand-logos bucket
CREATE POLICY "Allow public updates to brand-logos"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'brand-logos')
WITH CHECK (bucket_id = 'brand-logos');

-- Policy 4: Allow anyone to delete files from brand-logos bucket
CREATE POLICY "Allow public deletes from brand-logos"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'brand-logos');