ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS industrial_zone_id UUID REFERENCES public.industrial_zones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_industrial_zone_id
  ON public.companies (industrial_zone_id)
  WHERE industrial_zone_id IS NOT NULL;