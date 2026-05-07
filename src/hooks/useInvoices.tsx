import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './useCompany';
import { toast } from 'sonner';
import type { InvoiceStatus } from '@/lib/constants';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order?: number;
}

export interface Invoice {
  id: string;
  company_id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  client_address: string | null;
  client_phone: string | null;
  issue_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface CreateInvoiceData {
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  issue_date: string;
  due_date?: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  currency: string;
  notes?: string;
  items: InvoiceItem[];
}

export interface UpdateInvoiceData extends CreateInvoiceData {
  id: string;
}

export function useInvoices() {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!company?.id,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoiceData: CreateInvoiceData) => {
      if (!company?.id) throw new Error('No company found');
      
      const { items, ...invoiceFields } = invoiceData;
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{ ...invoiceFields, company_id: company.id }])
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Create invoice items
      if (items && items.length > 0) {
        const itemsWithInvoiceId = items.map((item, index) => ({
          ...item,
          invoice_id: invoice.id,
          sort_order: index,
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsWithInvoiceId);
        
        if (itemsError) throw itemsError;
      }
      
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully!');
    },
    onError: (error) => {
      toast.error('Failed to create invoice: ' + error.message);
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async (invoiceData: UpdateInvoiceData) => {
      const { id, items, ...invoiceFields } = invoiceData;
      
      // Update invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .update(invoiceFields)
        .eq('id', id)
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Delete existing items and re-create
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
      
      if (deleteError) throw deleteError;
      
      // Create new invoice items
      if (items && items.length > 0) {
        const itemsWithInvoiceId = items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          invoice_id: id,
          sort_order: index,
        }));
        
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsWithInvoiceId);
        
        if (itemsError) throw itemsError;
      }
      
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update invoice: ' + error.message);
    },
  });

  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated!');
    },
    onError: (error) => {
      toast.error('Failed to update invoice: ' + error.message);
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted!');
    },
    onError: (error) => {
      toast.error('Failed to delete invoice: ' + error.message);
    },
  });

  const getInvoiceWithItems = useCallback(async (invoiceId: string): Promise<Invoice | null> => {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    
    if (invoiceError) {
      toast.error('Failed to load invoice');
      return null;
    }

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sort_order');
    
    if (itemsError) {
      toast.error('Failed to load invoice items');
      return null;
    }

    return { ...invoice, items } as Invoice;
  }, []);

  const generateInvoiceNumber = useCallback((): string => {
    const prefix = company?.invoice_number_prefix || 'INV';
    const startNumber = Number(company?.invoice_number_start) || 1;
    
    if (!invoices || invoices.length === 0) {
      return `${prefix}-${String(startNumber).padStart(4, '0')}`;
    }

    // Extract numbers from existing invoice numbers with the same prefix
    const invoiceNumbers = invoices
      .filter(inv => inv.invoice_number.startsWith(`${prefix}-`))
      .map(inv => {
        const parts = inv.invoice_number.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        return isNaN(num) ? 0 : num;
      });

    const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : startNumber - 1;
    const nextNumber = Math.max(maxNumber + 1, startNumber);
    
    return `${prefix}-${String(nextNumber).padStart(4, '0')}`;
  }, [company, invoices]);

  return {
    invoices,
    isLoading,
    error,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getInvoiceWithItems,
    generateInvoiceNumber,
  };
}
