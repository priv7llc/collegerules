import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type WriterTierId = 'writer_unlock_1mo' | 'writer_unlock_3mo' | 'writer_unlock_lifetime';

export interface WriterTier {
  id: WriterTierId;
  label: string;
  price: number;
  cta: string;
  popular?: boolean;
}

export const WRITER_TIERS: WriterTier[] = [
  { id: 'writer_unlock_1mo', label: '1 Month', price: 1, cta: 'Unlock for 1 month — $1' },
  { id: 'writer_unlock_3mo', label: '3 Months', price: 3, cta: 'Unlock for 3 months — $3', popular: true },
  { id: 'writer_unlock_lifetime', label: 'Lifetime', price: 10, cta: 'Unlock forever — $10' },
];

export const startWriterCheckout = async (
  productCode: WriterTierId,
  opts: { userId: string; userEmail?: string | null; returnPath?: string },
) => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      product_code: productCode,
      user_id: opts.userId,
      user_email: opts.userEmail,
      return_path: opts.returnPath || '/app/scholarships',
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start checkout');
  window.top!.location.href = data.url;
};

export interface WriterAccessState {
  active: boolean;
  lifetime: boolean;
  expiresAt: string | null;
  loading: boolean;
}

export const useWriterUnlock = () => {
  const { user } = useAuth();
  const [state, setState] = useState<WriterAccessState>({
    active: false, lifetime: false, expiresAt: null, loading: true,
  });

  const load = useCallback(async () => {
    if (!user) { setState(s => ({ ...s, loading: false })); return; }
    const { data } = await supabase.rpc('writer_access_summary', { _user_id: user.id });
    const row: any = Array.isArray(data) ? data[0] : data;
    setState({
      active: !!row?.active,
      lifetime: !!row?.lifetime,
      expiresAt: row?.expires_at ?? null,
      loading: false,
    });
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
};
