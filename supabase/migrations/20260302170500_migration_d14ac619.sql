-- Add missing columns to company_settings
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS company_info_text TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD';