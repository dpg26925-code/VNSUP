-- Add SEO metadata columns to companies + auto-generation trigger + indexes

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS canonical_url text;

-- Helper: unaccent + slugify Vietnamese text
CREATE OR REPLACE FUNCTION public.factoryhub_slugify(_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text;
BEGIN
  IF _input IS NULL OR length(trim(_input)) = 0 THEN RETURN NULL; END IF;
  s := lower(_input);
  s := translate(s,
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydaaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd');
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '(^-+|-+$)', '', 'g');
  RETURN s;
END;
$$;

-- Auto-populate SEO fields on insert/update
CREATE OR REPLACE FUNCTION public.companies_autofill_seo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  candidate text;
  suffix int := 1;
BEGIN
  -- Slug
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    base_slug := public.factoryhub_slugify(NEW.name);
    IF base_slug IS NULL THEN base_slug := 'cong-ty-' || substr(NEW.id::text, 1, 8); END IF;
    candidate := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = candidate AND id <> NEW.id) LOOP
      suffix := suffix + 1;
      candidate := base_slug || '-' || suffix;
    END LOOP;
    NEW.slug := candidate;
  END IF;

  -- Meta title
  IF NEW.meta_title IS NULL OR length(trim(NEW.meta_title)) = 0 THEN
    NEW.meta_title := left(
      NEW.name || ' | ' || COALESCE(NEW.industry, 'Sản xuất') ||
      ' tại ' || COALESCE(NEW.province, 'Việt Nam') || ' | FactoryHub',
      160
    );
  END IF;

  -- Meta description
  IF NEW.meta_description IS NULL OR length(trim(NEW.meta_description)) = 0 THEN
    NEW.meta_description := left(
      COALESCE(
        NEW.ai_summary,
        NEW.description,
        'Nhà máy ' || COALESCE(NEW.industry, 'sản xuất') ||
        ' tại ' || COALESCE(NEW.province, 'Việt Nam') ||
        '. Xem năng lực sản xuất, liên hệ và gửi yêu cầu báo giá trên FactoryHub.'
      ),
      160
    );
  END IF;

  -- Canonical URL (relative path; frontend joins with site host)
  NEW.canonical_url := '/company/' || NEW.slug;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_autofill_seo ON public.companies;
CREATE TRIGGER trg_companies_autofill_seo
  BEFORE INSERT OR UPDATE OF name, slug, industry, province, description, ai_summary
  ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.companies_autofill_seo();

-- Indexes for admin lookups
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_key ON public.companies (slug);
CREATE INDEX IF NOT EXISTS companies_status_created_idx ON public.companies (status, created_at DESC);
CREATE INDEX IF NOT EXISTS companies_industry_idx ON public.companies (industry);
CREATE INDEX IF NOT EXISTS companies_province_idx ON public.companies (province);

-- Backfill existing rows
UPDATE public.companies SET updated_at = updated_at WHERE meta_title IS NULL OR meta_description IS NULL OR canonical_url IS NULL;