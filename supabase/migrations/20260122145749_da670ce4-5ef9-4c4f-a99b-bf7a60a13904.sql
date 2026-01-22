-- Add new columns to quotes table for proposal validity, payment terms, and body type
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS quote_validity_days integer DEFAULT 15,
ADD COLUMN IF NOT EXISTS payment_term_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS body_type_id uuid REFERENCES body_types(id);