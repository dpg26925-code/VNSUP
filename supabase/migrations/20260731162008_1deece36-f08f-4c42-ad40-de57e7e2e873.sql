ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS verification_level text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS address_verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.search_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  results_count integer NOT NULL DEFAULT 0,
  user_agent text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.search_logs TO anon;
GRANT SELECT, INSERT ON public.search_logs TO authenticated;
GRANT ALL ON public.search_logs TO service_role;

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log searches" ON public.search_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read search logs" ON public.search_logs FOR SELECT TO authenticated USING (public.is_admin_role(auth.uid()));

CREATE INDEX IF NOT EXISTS search_logs_created_at_idx ON public.search_logs (created_at DESC);