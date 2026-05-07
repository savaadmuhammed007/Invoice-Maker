import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Company {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  tax_id: string | null;
  logo_url: string | null;
  default_currency: string;
  default_tax_rate: number;
  invoice_number_prefix: string | null;
  invoice_number_start: number | null;
  created_at: string;
  updated_at: string;
}

export function useCompany() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: company, isLoading, isFetched, error } = useQuery({
    queryKey: ['company', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Company | null;
    },
    enabled: !!user?.id,
  });
  
  // Only consider loading complete when user is available and query has been fetched
  const isReady = !!user && isFetched;

  const createCompany = useMutation({
    mutationFn: async (companyData: { name: string } & Partial<Omit<Company, 'name'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('companies')
        .insert([{ ...companyData, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Company profile created!');
    },
    onError: (error) => {
      toast.error('Failed to create company: ' + error.message);
    },
  });

  const updateCompany = useMutation({
    mutationFn: async (companyData: Partial<Company>) => {
      if (!company?.id) throw new Error('No company found');
      
      const { data, error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', company.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success('Company profile updated!');
    },
    onError: (error) => {
      toast.error('Failed to update company: ' + error.message);
    },
  });

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload logo: ' + uploadError.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('company-logos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  return {
    company,
    isLoading,
    isReady,
    error,
    createCompany,
    updateCompany,
    uploadLogo,
  };
}
