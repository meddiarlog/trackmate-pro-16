-- Create boletos table
CREATE TABLE public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Anexado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view boletos" ON public.boletos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert boletos" ON public.boletos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update boletos" ON public.boletos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete boletos" ON public.boletos FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_boletos_updated_at
BEFORE UPDATE ON public.boletos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for boletos
INSERT INTO storage.buckets (id, name, public) VALUES ('boletos', 'boletos', true);

-- Storage policies
CREATE POLICY "Anyone can view boleto files" ON storage.objects FOR SELECT USING (bucket_id = 'boletos');
CREATE POLICY "Anyone can upload boleto files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'boletos');
CREATE POLICY "Anyone can update boleto files" ON storage.objects FOR UPDATE USING (bucket_id = 'boletos');
CREATE POLICY "Anyone can delete boleto files" ON storage.objects FOR DELETE USING (bucket_id = 'boletos');