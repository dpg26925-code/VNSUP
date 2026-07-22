
REVOKE ALL ON public.company_claims FROM anon;
REVOKE ALL ON public.company_updates FROM anon;
GRANT SELECT ON public.company_updates TO anon;
