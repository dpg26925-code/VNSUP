
-- Link claims to authenticated user + allow self-view
ALTER TABLE public.company_claims ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS company_claims_user_id_idx ON public.company_claims(user_id);
CREATE INDEX IF NOT EXISTS company_claims_company_id_idx ON public.company_claims(company_id);

DROP POLICY IF EXISTS "Users view own claims" ON public.company_claims;
CREATE POLICY "Users view own claims" ON public.company_claims
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- On approval, assign the claimant as the company's owner (submitted_by)
CREATE OR REPLACE FUNCTION public.company_claims_apply_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.user_id IS NOT NULL THEN
    UPDATE public.companies
       SET submitted_by = NEW.user_id
     WHERE id = NEW.company_id;
    NEW.reviewed_at := now();
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_claims_apply_approval ON public.company_claims;
CREATE TRIGGER trg_company_claims_apply_approval
  BEFORE UPDATE ON public.company_claims
  FOR EACH ROW EXECUTE FUNCTION public.company_claims_apply_approval();
