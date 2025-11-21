-- Create the brand-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload brand logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-logos');

CREATE POLICY "Allow public to view brand logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'brand-logos');

CREATE POLICY "Allow authenticated users to update brand logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-logos');

CREATE POLICY "Allow authenticated users to delete brand logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'brand-logos');