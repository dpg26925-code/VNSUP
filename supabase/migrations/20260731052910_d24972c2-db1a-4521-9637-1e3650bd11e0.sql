
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tax_code varchar(20);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS business_registration_number varchar(50);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS legal_representative varchar(100);
CREATE UNIQUE INDEX IF NOT EXISTS companies_tax_code_key ON public.companies (tax_code) WHERE tax_code IS NOT NULL;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS moq text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lead_time text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_range text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS catalog_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- helper: caller may manage a company
CREATE OR REPLACE FUNCTION public.can_manage_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id
      AND (c.submitted_by = auth.uid() OR public.is_admin_role(auth.uid()))
  );
$$;

CREATE OR REPLACE FUNCTION public.company_is_public(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id AND c.status = 'approved'
  );
$$;

CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  certificate_url text,
  issued_at date,
  expires_at date,
  verification_status text NOT NULL DEFAULT 'pending',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certifications TO authenticated;
GRANT ALL ON public.certifications TO service_role;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certifications_public_read" ON public.certifications FOR SELECT USING (public.company_is_public(company_id));
CREATE POLICY "certifications_owner_write" ON public.certifications FOR ALL TO authenticated
  USING (public.can_manage_company(company_id)) WITH CHECK (public.can_manage_company(company_id));

CREATE TABLE IF NOT EXISTS public.company_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_gallery TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_gallery TO authenticated;
GRANT ALL ON public.company_gallery TO service_role;
ALTER TABLE public.company_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_gallery_public_read" ON public.company_gallery FOR SELECT USING (public.company_is_public(company_id));
CREATE POLICY "company_gallery_owner_write" ON public.company_gallery FOR ALL TO authenticated
  USING (public.can_manage_company(company_id)) WITH CHECK (public.can_manage_company(company_id));

CREATE TABLE IF NOT EXISTS public.company_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text,
  video_url text NOT NULL,
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_videos TO authenticated;
GRANT ALL ON public.company_videos TO service_role;
ALTER TABLE public.company_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_videos_public_read" ON public.company_videos FOR SELECT USING (public.company_is_public(company_id));
CREATE POLICY "company_videos_owner_write" ON public.company_videos FOR ALL TO authenticated
  USING (public.can_manage_company(company_id)) WITH CHECK (public.can_manage_company(company_id));

CREATE TABLE IF NOT EXISTS public.company_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_faqs TO authenticated;
GRANT ALL ON public.company_faqs TO service_role;
ALTER TABLE public.company_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_faqs_public_read" ON public.company_faqs FOR SELECT USING (public.company_is_public(company_id));
CREATE POLICY "company_faqs_owner_write" ON public.company_faqs FOR ALL TO authenticated
  USING (public.can_manage_company(company_id)) WITH CHECK (public.can_manage_company(company_id));

CREATE TABLE IF NOT EXISTS public.company_export_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  country text NOT NULL,
  share_percent integer,
  note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_export_markets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_export_markets TO authenticated;
GRANT ALL ON public.company_export_markets TO service_role;
ALTER TABLE public.company_export_markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_export_markets_public_read" ON public.company_export_markets FOR SELECT USING (public.company_is_public(company_id));
CREATE POLICY "company_export_markets_owner_write" ON public.company_export_markets FOR ALL TO authenticated
  USING (public.can_manage_company(company_id)) WITH CHECK (public.can_manage_company(company_id));

CREATE TABLE IF NOT EXISTS public.slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL DEFAULT 'company',
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, old_slug)
);
GRANT SELECT ON public.slug_redirects TO anon;
GRANT SELECT ON public.slug_redirects TO authenticated;
GRANT ALL ON public.slug_redirects TO service_role;
ALTER TABLE public.slug_redirects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slug_redirects_public_read" ON public.slug_redirects FOR SELECT USING (true);
CREATE POLICY "slug_redirects_admin_write" ON public.slug_redirects FOR ALL TO authenticated
  USING (public.is_admin_role(auth.uid())) WITH CHECK (public.is_admin_role(auth.uid()));

CREATE TRIGGER certifications_updated_at BEFORE UPDATE ON public.certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
