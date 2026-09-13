import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UnlockState {
  unlocked: boolean;
  unlimited: boolean;
  availableSlots: number;
  used: number;
  loading: boolean;
}

export type UnlockTierId = 'route_unlock_1' | 'route_unlock_5pack' | 'route_unlock_unlimited';

export interface UnlockTier {
  id: UnlockTierId;
  label: string;
  price: number;
  cta: string;
  best?: boolean;
}

export const UNLOCK_TIERS: UnlockTier[] = [
  { id: 'route_unlock_1', label: 'This route', price: 1, cta: 'Unlock this route — $1' },
  { id: 'route_unlock_5pack', label: '5 routes', price: 3, cta: 'Unlock 5 routes — $3', best: true },
  { id: 'route_unlock_unlimited', label: 'Unlimited', price: 10, cta: 'Unlock everything — $10' },
];

export const startUnlockCheckout = async (
  productCode: UnlockTierId,
  opts: { userId: string; userEmail?: string | null; routeId?: string | null; returnPath?: string },
) => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      product_code: productCode,
      user_id: opts.userId,
      user_email: opts.userEmail,
      route_id: opts.routeId || null,
      return_path: opts.returnPath || '/app',
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Could not start checkout');
  window.top!.location.href = data.url;
};

export const useRouteUnlock = (routeId?: string | null) => {
  const { user } = useAuth();
  const [state, setState] = useState<UnlockState>({
    unlocked: false, unlimited: false, availableSlots: 0, used: 0, loading: true,
  });

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: summary }, { data: unlockedRes }] = await Promise.all([
      supabase.rpc('unlock_summary', { _user_id: user.id }),
      routeId
        ? supabase.rpc('is_route_unlocked', { _user_id: user.id, _route_id: routeId })
        : Promise.resolve({ data: false } as any),
    ]);
    const s = Array.isArray(summary) ? summary[0] : summary;
    setState({
      unlocked: !!unlockedRes,
      unlimited: !!s?.unlimited,
      availableSlots: s?.available ?? 0,
      used: s?.used ?? 0,
      loading: false,
    });
  }, [user, routeId]);

  useEffect(() => { load(); }, [load]);

  const redeemSlot = useCallback(async () => {
    if (!routeId) return false;
    const { data, error } = await supabase.rpc('redeem_unlock_slot', { _route_id: routeId });
    if (error) throw error;
    if (data) await load();
    return !!data;
  }, [routeId, load]);

  return { ...state, refresh: load, redeemSlot };
};
