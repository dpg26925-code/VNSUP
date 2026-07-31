CREATE TABLE public.import_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'hermes',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  performed_by uuid,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.import_logs TO authenticated;
GRANT ALL ON public.import_logs TO service_role;

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view import logs"
ON public.import_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_import_logs_updated_at
BEFORE UPDATE ON public.import_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_import_logs_performed_at ON public.import_logs (performed_at DESC);