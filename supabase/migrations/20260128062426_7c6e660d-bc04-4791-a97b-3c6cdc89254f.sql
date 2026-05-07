-- Add invoice number starting field to companies table
ALTER TABLE public.companies 
ADD COLUMN invoice_number_prefix text DEFAULT 'INV',
ADD COLUMN invoice_number_start integer DEFAULT 1;