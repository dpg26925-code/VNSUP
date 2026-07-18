
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Celebrities
CREATE TABLE public.celebrities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  stage_name text,
  avatar_url text,
  cover_url text,
  bio text,
  nationality text,
  birth_date date,
  category text NOT NULL DEFAULT 'other',
  achievements text[] NOT NULL DEFAULT '{}',
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  views integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.celebrities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.celebrities TO authenticated;
GRANT ALL ON public.celebrities TO service_role;
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published celebrities" ON public.celebrities
  FOR SELECT TO anon, authenticated USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert celebrities" ON public.celebrities
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update celebrities" ON public.celebrities
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete celebrities" ON public.celebrities
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX celebrities_category_idx ON public.celebrities(category);
CREATE INDEX celebrities_featured_idx ON public.celebrities(featured) WHERE featured = true;

CREATE TRIGGER update_celebrities_updated_at
  BEFORE UPDATE ON public.celebrities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
