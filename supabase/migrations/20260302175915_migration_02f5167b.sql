-- Add multi-currency support to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS unit_price_usd numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_price_iqd numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_usd numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_iqd numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS model text;

-- Migrate existing price to unit_price_usd
UPDATE products SET unit_price_usd = price WHERE unit_price_usd = 0;