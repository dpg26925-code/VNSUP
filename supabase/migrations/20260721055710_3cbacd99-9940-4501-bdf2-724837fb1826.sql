
-- 1) Add columns
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 2) Constrain status values
DO $$ BEGIN
  ALTER TABLE public.companies
    ADD CONSTRAINT companies_status_check CHECK (status IN ('pending','approved','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Backfill existing rows to approved
UPDATE public.companies SET status = 'approved' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS companies_status_idx ON public.companies(status);
CREATE INDEX IF NOT EXISTS companies_submitted_by_idx ON public.companies(submitted_by);

-- 4) Replace policies
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Admins insert companies" ON public.companies;
DROP POLICY IF EXISTS "Admins update companies" ON public.companies;
DROP POLICY IF EXISTS "Admins delete companies" ON public.companies;

-- Public: only approved
CREATE POLICY "Public view approved companies"
  ON public.companies FOR SELECT
  USING (status = 'approved');

-- Owners: view their own submissions (any status)
CREATE POLICY "Owners view own companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (submitted_by = auth.uid());

-- Admins: view all
CREATE POLICY "Admins view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can submit companies (must go pending, must own it)
CREATE POLICY "Users submit companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND status = 'pending'
  );

-- Owners can edit their own submission while still pending; status cannot flip
CREATE POLICY "Owners update own pending"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (submitted_by = auth.uid() AND status = 'pending')
  WITH CHECK (submitted_by = auth.uid() AND status = 'pending');

-- Admins full write
CREATE POLICY "Admins insert companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete companies"
  ON public.companies FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
