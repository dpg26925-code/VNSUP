-- Migration: 20260905000000_company_reviews_and_media.sql
-- Description: Ensure company_reviews has reviewer_company, is_verified, review_text, and optimize indexes

-- 1. Create company_reviews table if it does not exist
CREATE TABLE IF NOT EXISTS public.company_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name text,
  reviewer_company text,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  content text,
  review_text text,
  is_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add columns if table already existed without them
ALTER TABLE public.company_reviews
  ADD COLUMN IF NOT EXISTS reviewer_company text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_text text;

-- 3. Synchronize review_text and content if needed
UPDATE public.company_reviews
SET review_text = content
WHERE review_text IS NULL AND content IS NOT NULL;

UPDATE public.company_reviews
SET content = review_text
WHERE content IS NULL AND review_text IS NOT NULL;

-- 4. Set up grants and permissions
GRANT SELECT ON public.company_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_reviews TO authenticated;
GRANT ALL ON public.company_reviews TO service_role;

-- 5. Enable Row Level Security
ALTER TABLE public.company_reviews ENABLE ROW LEVEL SECURITY;

-- 6. Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_reviews' AND policyname = 'Anyone can read published reviews'
  ) THEN
    CREATE POLICY "Anyone can read published reviews"
      ON public.company_reviews FOR SELECT
      USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_reviews' AND policyname = 'Authenticated users can insert reviews'
  ) THEN
    CREATE POLICY "Authenticated users can insert reviews"
      ON public.company_reviews FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_reviews' AND policyname = 'Users can update their own reviews'
  ) THEN
    CREATE POLICY "Users can update their own reviews"
      ON public.company_reviews FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_reviews' AND policyname = 'Users can delete their own reviews'
  ) THEN
    CREATE POLICY "Users can delete their own reviews"
      ON public.company_reviews FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_reviews' AND policyname = 'Service role manages all reviews'
  ) THEN
    CREATE POLICY "Service role manages all reviews"
      ON public.company_reviews FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 7. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_company_reviews_company_status
  ON public.company_reviews(company_id, status, created_at DESC);
