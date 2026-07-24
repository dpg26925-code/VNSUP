
-- Enum
DO $$ BEGIN
  CREATE TYPE public.zone_kind AS ENUM ('kcn','ccn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.industrial_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.zone_kind NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  province text,
  district text,
  address text,
  developer text,
  established_year int,
  area_ha numeric,
  occupancy_percent int,
  land_price_usd_m2_year numeric,
  industries text[] DEFAULT '{}',
  logo_url text,
  banner_url text,
  gallery_url text[] DEFAULT '{}',
  description text,
  ai_summary text,
  highlights text[] DEFAULT '{}',
  contact_phone text,
  contact_email text,
  website_url text,
  latitude numeric,
  longitude numeric,
  faqs jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  meta_title text,
  meta_description text,
  canonical_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS industrial_zones_kind_status_idx ON public.industrial_zones(kind, status);
CREATE INDEX IF NOT EXISTS industrial_zones_province_idx ON public.industrial_zones(province);

-- Grants
GRANT SELECT ON public.industrial_zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.industrial_zones TO authenticated;
GRANT ALL ON public.industrial_zones TO service_role;

-- RLS
ALTER TABLE public.industrial_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zones public read approved" ON public.industrial_zones
  FOR SELECT USING (status = 'approved');

CREATE POLICY "zones admin read all" ON public.industrial_zones
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "zones admin insert" ON public.industrial_zones
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "zones admin update" ON public.industrial_zones
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "zones admin delete" ON public.industrial_zones
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- SEO autofill trigger
CREATE OR REPLACE FUNCTION public.industrial_zones_autofill_seo()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 1;
  kind_label text;
  route_prefix text;
BEGIN
  IF NEW.kind = 'kcn' THEN kind_label := 'KCN'; route_prefix := '/khu-cong-nghiep/';
  ELSE kind_label := 'CCN'; route_prefix := '/cum-cong-nghiep/';
  END IF;

  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    base_slug := public.factoryhub_slugify(NEW.name);
    IF base_slug IS NULL THEN base_slug := 'zone-' || substr(NEW.id::text, 1, 8); END IF;
    candidate := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.industrial_zones WHERE slug = candidate AND id <> NEW.id) LOOP
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix;
    END LOOP;
    NEW.slug := candidate;
  END IF;

  IF NEW.meta_title IS NULL OR length(trim(NEW.meta_title)) = 0 THEN
    NEW.meta_title := left(
      NEW.name || ' — ' || kind_label ||
      ' tại ' || COALESCE(NEW.province, 'Việt Nam') || ' | VNSupplier',
      160
    );
  END IF;

  IF NEW.meta_description IS NULL OR length(trim(NEW.meta_description)) = 0 THEN
    NEW.meta_description := left(
      COALESCE(
        NEW.ai_summary,
        NEW.description,
        kind_label || ' ' || NEW.name ||
        CASE WHEN NEW.area_ha IS NOT NULL THEN ' diện tích ' || NEW.area_ha || 'ha' ELSE '' END ||
        ' tại ' || COALESCE(NEW.province, 'Việt Nam') ||
        '. Xem chi tiết chủ đầu tư, ngành nghề ưu tiên, giá thuê và liên hệ trên VNSupplier.'
      ),
      160
    );
  END IF;

  NEW.canonical_url := route_prefix || NEW.slug;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_industrial_zones_seo ON public.industrial_zones;
CREATE TRIGGER trg_industrial_zones_seo
  BEFORE INSERT OR UPDATE ON public.industrial_zones
  FOR EACH ROW EXECUTE FUNCTION public.industrial_zones_autofill_seo();

DROP TRIGGER IF EXISTS trg_industrial_zones_updated_at ON public.industrial_zones;
CREATE TRIGGER trg_industrial_zones_updated_at
  BEFORE UPDATE ON public.industrial_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Remove now-redundant category rows
DELETE FROM public.categories WHERE slug IN ('khu-cong-nghiep','cum-cong-nghiep');
