
-- 1. Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'publisher';

-- Commit enum change before use
COMMIT;
BEGIN;

-- 2. Helper: any admin-tier role?
CREATE OR REPLACE FUNCTION public.is_admin_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','publisher','editor')
  );
$$;

-- 3. Post status enum
DO $$ BEGIN
  CREATE TYPE public.post_status AS ENUM ('draft','pending','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'publisher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'publisher'));
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Articles
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  status public.post_status NOT NULL DEFAULT 'draft',
  meta_title text,
  meta_description text,
  og_image text,
  published_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);

GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public reads only see published articles
CREATE POLICY "articles_public_read_published" ON public.articles FOR SELECT
  USING (status = 'published');
-- Author + admin tier can see all their/any drafts
CREATE POLICY "articles_admin_read_all" ON public.articles FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR public.is_admin_role(auth.uid()));
-- Any admin-tier user can insert
CREATE POLICY "articles_admin_insert" ON public.articles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_role(auth.uid()));
-- Editors can update own drafts; publisher/admin update all
CREATE POLICY "articles_update" ON public.articles FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'publisher')
    OR (public.has_role(auth.uid(),'editor') AND author_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'publisher')
    OR (public.has_role(auth.uid(),'editor') AND author_id = auth.uid())
  );
-- Only admin/publisher can delete
CREATE POLICY "articles_delete" ON public.articles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'publisher'));

CREATE TRIGGER trg_articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  target_slug text,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_log(created_at DESC);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_admin_read" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 7. Seed categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Sản xuất CNC','cnc','Gia công cơ khí CNC, tiện phay'),
  ('Nhựa & Cao su','nhua-cao-su','Ép nhựa, đùn nhựa, cao su kỹ thuật'),
  ('Điện tử & SMT','dien-tu-smt','Lắp ráp điện tử, PCB, SMT'),
  ('Cơ khí chính xác','co-khi-chinh-xac','Cơ khí chính xác, khuôn mẫu'),
  ('Bao bì','bao-bi','Bao bì giấy, nhựa, in ấn'),
  ('Tin ngành','tin-nganh','Tin tức ngành sản xuất Việt Nam')
ON CONFLICT (slug) DO NOTHING;

COMMIT;
