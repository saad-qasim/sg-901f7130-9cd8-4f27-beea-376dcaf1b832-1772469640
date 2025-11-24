CREATE OR REPLACE FUNCTION get_sales_statistics(
    start_date TEXT DEFAULT NULL,
    end_date TEXT DEFAULT NULL
)
RETURNS TABLE (
    "totalInvoices" BIGINT,
    "totalSalesIQD" NUMERIC,
    "totalSalesUSD" NUMERIC,
    "avgInvoiceValueIQD" NUMERIC,
    "avgInvoiceValueUSD" NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) AS "totalInvoices",
        COALESCE(SUM(CASE WHEN currency = 'IQD' THEN total ELSE 0 END), 0) AS "totalSalesIQD",
        COALESCE(SUM(CASE WHEN currency = 'USD' THEN total ELSE 0 END), 0) AS "totalSalesUSD",
        COALESCE(AVG(CASE WHEN currency = 'IQD' THEN total END), 0) AS "avgInvoiceValueIQD",
        COALESCE(AVG(CASE WHEN currency = 'USD' THEN total END), 0) AS "avgInvoiceValueUSD"
    FROM
        invoices
    WHERE
        (start_date IS NULL OR invoice_date >= start_date::DATE) AND
        (end_date IS NULL OR invoice_date <= end_date::DATE);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_invoices_by_brand(
    start_date TEXT DEFAULT NULL,
    end_date TEXT DEFAULT NULL
)
RETURNS TABLE (
    brand_name TEXT,
    invoice_count BIGINT,
    total_sales_iqd NUMERIC,
    total_sales_usd NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.name AS brand_name,
        COUNT(i.id) AS invoice_count,
        COALESCE(SUM(CASE WHEN i.currency = 'IQD' THEN i.total ELSE 0 END), 0) AS total_sales_iqd,
        COALESCE(SUM(CASE WHEN i.currency = 'USD' THEN i.total ELSE 0 END), 0) AS total_sales_usd
    FROM
        invoices i
    JOIN
        brands b ON i.brand_id = b.id
    WHERE
        (start_date IS NULL OR i.invoice_date >= start_date::DATE) AND
        (end_date IS NULL OR i.invoice_date <= end_date::DATE)
    GROUP BY
        b.name
    ORDER BY
        invoice_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create the storage bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the logos bucket to allow public access
CREATE POLICY "Public read access for logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');