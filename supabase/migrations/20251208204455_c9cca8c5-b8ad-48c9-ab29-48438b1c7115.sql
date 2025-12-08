-- Add logo_url column to company_settings
ALTER TABLE public.company_settings ADD COLUMN logo_url TEXT;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to company logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow authenticated users to upload company logos
CREATE POLICY "Anyone can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos');

-- Allow authenticated users to update company logos
CREATE POLICY "Anyone can update company logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-logos');

-- Allow authenticated users to delete company logos
CREATE POLICY "Anyone can delete company logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-logos');