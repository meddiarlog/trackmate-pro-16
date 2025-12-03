-- Add pdf_url column to ctes table
ALTER TABLE public.ctes ADD COLUMN IF NOT EXISTS pdf_url text;

-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  cpf text,
  cnh text,
  cnh_expiry date,
  phone text,
  email text,
  status text DEFAULT 'Ativo',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view drivers" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert drivers" ON public.drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update drivers" ON public.drivers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete drivers" ON public.drivers FOR DELETE USING (true);

-- Create driver_documents table
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view driver_documents" ON public.driver_documents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert driver_documents" ON public.driver_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update driver_documents" ON public.driver_documents FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete driver_documents" ON public.driver_documents FOR DELETE USING (true);

-- Create repository_folders table
CREATE TABLE IF NOT EXISTS public.repository_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid REFERENCES public.repository_folders(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.repository_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view repository_folders" ON public.repository_folders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert repository_folders" ON public.repository_folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update repository_folders" ON public.repository_folders FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete repository_folders" ON public.repository_folders FOR DELETE USING (true);

-- Create repository_files table
CREATE TABLE IF NOT EXISTS public.repository_files (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid REFERENCES public.repository_folders(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.repository_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view repository_files" ON public.repository_files FOR SELECT USING (true);
CREATE POLICY "Anyone can insert repository_files" ON public.repository_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update repository_files" ON public.repository_files FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete repository_files" ON public.repository_files FOR DELETE USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('cte-pdfs', 'cte-pdfs', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-documents', 'driver-documents', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('repository-files', 'repository-files', true) ON CONFLICT DO NOTHING;

-- Storage policies for cte-pdfs
CREATE POLICY "Anyone can view cte-pdfs" ON storage.objects FOR SELECT USING (bucket_id = 'cte-pdfs');
CREATE POLICY "Anyone can upload cte-pdfs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cte-pdfs');
CREATE POLICY "Anyone can update cte-pdfs" ON storage.objects FOR UPDATE USING (bucket_id = 'cte-pdfs');
CREATE POLICY "Anyone can delete cte-pdfs" ON storage.objects FOR DELETE USING (bucket_id = 'cte-pdfs');

-- Storage policies for driver-documents
CREATE POLICY "Anyone can view driver-documents" ON storage.objects FOR SELECT USING (bucket_id = 'driver-documents');
CREATE POLICY "Anyone can upload driver-documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'driver-documents');
CREATE POLICY "Anyone can update driver-documents" ON storage.objects FOR UPDATE USING (bucket_id = 'driver-documents');
CREATE POLICY "Anyone can delete driver-documents" ON storage.objects FOR DELETE USING (bucket_id = 'driver-documents');

-- Storage policies for repository-files
CREATE POLICY "Anyone can view repository-files" ON storage.objects FOR SELECT USING (bucket_id = 'repository-files');
CREATE POLICY "Anyone can upload repository-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'repository-files');
CREATE POLICY "Anyone can update repository-files" ON storage.objects FOR UPDATE USING (bucket_id = 'repository-files');
CREATE POLICY "Anyone can delete repository-files" ON storage.objects FOR DELETE USING (bucket_id = 'repository-files');