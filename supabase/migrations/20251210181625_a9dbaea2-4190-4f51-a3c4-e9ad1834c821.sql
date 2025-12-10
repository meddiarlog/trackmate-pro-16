-- Add new columns for tratativa and rescheduling functionality
ALTER TABLE public.boletos 
ADD COLUMN IF NOT EXISTS tratativa_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS data_acerto date DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.boletos.tratativa_status IS 'Status da tratativa: Acertado, Pendente Cliente, Pendente Nós';
COMMENT ON COLUMN public.boletos.data_acerto IS 'Data de acerto/conclusão da tratativa';