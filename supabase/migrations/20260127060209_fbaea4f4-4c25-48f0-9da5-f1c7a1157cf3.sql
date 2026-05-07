-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own customers"
ON public.customers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = customers.company_id
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can create customers for their company"
ON public.customers
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = customers.company_id
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can update their own customers"
ON public.customers
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = customers.company_id
  AND companies.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own customers"
ON public.customers
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM companies
  WHERE companies.id = customers.company_id
  AND companies.user_id = auth.uid()
));

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();