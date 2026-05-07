-- Create companies table (company profiles linked to users)
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    postal_code TEXT,
    tax_id TEXT,
    logo_url TEXT,
    default_currency TEXT DEFAULT 'USD',
    default_tax_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'unpaid', 'overdue');

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_address TEXT,
    client_phone TEXT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status public.invoice_status NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice items table
CREATE TABLE public.invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for companies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own company" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company" ON public.companies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company" ON public.companies
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for invoices (through company ownership)
CREATE POLICY "Users can view their own invoices" ON public.invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = invoices.company_id 
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create invoices for their company" ON public.invoices
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = company_id 
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own invoices" ON public.invoices
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = invoices.company_id 
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own invoices" ON public.invoices
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = invoices.company_id 
            AND companies.user_id = auth.uid()
        )
    );

-- RLS policies for invoice items (through invoice ownership)
CREATE POLICY "Users can view their own invoice items" ON public.invoice_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            JOIN public.companies ON companies.id = invoices.company_id
            WHERE invoices.id = invoice_items.invoice_id 
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create invoice items for their invoices" ON public.invoice_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices 
            JOIN public.companies ON companies.id = invoices.company_id
            WHERE invoices.id = invoice_id 
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own invoice items" ON public.invoice_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            JOIN public.companies ON companies.id = invoices.company_id
            WHERE invoices.id = invoice_items.invoice_id 
            AND companies.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own invoice items" ON public.invoice_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            JOIN public.companies ON companies.id = invoices.company_id
            WHERE invoices.id = invoice_items.invoice_id 
            AND companies.user_id = auth.uid()
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

-- Storage policies for company logos
CREATE POLICY "Anyone can view company logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own logos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own logos" ON storage.objects
    FOR DELETE USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');