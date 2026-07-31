-- 1. Extend existing subscriptions with scope + tier
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS industry_slug text,
  ADD COLUMN IF NOT EXISTS province_slug text,
  ADD COLUMN IF NOT EXISTS tier smallint,
  ADD COLUMN IF NOT EXISTS amount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_scope ON public.subscriptions(industry_slug, province_slug);

-- 2. featured_bids
CREATE TABLE IF NOT EXISTS public.featured_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  industry_slug text NOT NULL,
  province_slug text NOT NULL,
  bid_amount integer NOT NULL,
  effective_bid integer NOT NULL DEFAULT 0,
  bid_status text NOT NULL DEFAULT 'active',
  period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  rank integer,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.featured_bids TO authenticated;
GRANT SELECT ON public.featured_bids TO anon;
GRANT ALL ON public.featured_bids TO service_role;

ALTER TABLE public.featured_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "featured_bids_public_read_won" ON public.featured_bids
  FOR SELECT TO anon
  USING (bid_status = 'won');

CREATE POLICY "featured_bids_owner_or_admin_read" ON public.featured_bids
  FOR SELECT TO authenticated
  USING (public.can_manage_company(company_id) OR bid_status = 'won');

CREATE POLICY "featured_bids_owner_insert" ON public.featured_bids
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_company(company_id));

CREATE POLICY "featured_bids_owner_update" ON public.featured_bids
  FOR UPDATE TO authenticated
  USING (public.can_manage_company(company_id))
  WITH CHECK (public.can_manage_company(company_id));

CREATE POLICY "featured_bids_admin_delete" ON public.featured_bids
  FOR DELETE TO authenticated
  USING (public.is_admin_role(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_featured_bids_slot
  ON public.featured_bids(industry_slug, province_slug, period_start);
CREATE INDEX IF NOT EXISTS idx_featured_bids_company ON public.featured_bids(company_id);

CREATE TRIGGER update_featured_bids_updated_at
  BEFORE UPDATE ON public.featured_bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. priority_cache
CREATE TABLE IF NOT EXISTS public.priority_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_slug text NOT NULL,
  province_slug text NOT NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  priority_score integer NOT NULL,
  display_order integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (industry_slug, province_slug, company_id)
);

GRANT SELECT ON public.priority_cache TO anon;
GRANT SELECT ON public.priority_cache TO authenticated;
GRANT ALL ON public.priority_cache TO service_role;

ALTER TABLE public.priority_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "priority_cache_public_read" ON public.priority_cache
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_priority_cache_lookup
  ON public.priority_cache(industry_slug, province_slug, display_order);