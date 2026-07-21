ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS stock_exchange text,
  ADD COLUMN IF NOT EXISTS stock_ticker text;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_stock_exchange_check;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_stock_exchange_check
  CHECK (stock_exchange IS NULL OR stock_exchange IN ('HOSE','HNX','UPCOM','Khác'));

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_stock_ticker_format;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_stock_ticker_format
  CHECK (stock_ticker IS NULL OR stock_ticker ~ '^[A-Z0-9]{2,10}$');