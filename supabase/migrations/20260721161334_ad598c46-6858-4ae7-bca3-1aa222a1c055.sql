
-- Revoke public/anon access on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_role(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.company_claims_apply_approval() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- Tighten permissive INSERT policies
DROP POLICY IF EXISTS "Anyone submit claims" ON public.company_claims;
CREATE POLICY "Authenticated users submit claims" ON public.company_claims
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone submit leads" ON public.leads;
CREATE POLICY "Public submit leads" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    company_id IS NOT NULL
    AND length(btrim(name)) BETWEEN 1 AND 200
    AND length(btrim(email)) BETWEEN 3 AND 200
    AND email LIKE '%_@_%.__%'
    AND length(coalesce(message,'')) <= 5000
  );
