
-- Extend user_roles with v2 flags
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS allowed_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS can_publish boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_manage_users boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpers per v2 spec
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role::text
    WHEN 'admin'     THEN 1
    WHEN 'publisher' THEN 2
    WHEN 'editor'    THEN 3
    WHEN 'user'      THEN 4
    WHEN 'viewer'    THEN 5
    ELSE 99
  END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_publish(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role IN ('admin','publisher') OR can_publish = true)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_delete(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (role IN ('admin','publisher') OR can_delete = true)
  );
$$;

-- Restrict function execution to authenticated (avoid anon SECURITY DEFINER warning)
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_publish(uuid)   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_delete(uuid)    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_publish(uuid)   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_delete(uuid)    TO authenticated, service_role;
