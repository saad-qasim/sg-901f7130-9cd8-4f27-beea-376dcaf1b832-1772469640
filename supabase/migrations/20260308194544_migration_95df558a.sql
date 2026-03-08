-- Add missing columns to products table for product-specific warranty and stock alerts
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_text TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 0;