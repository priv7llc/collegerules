import { useState } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { UNLOCK_TIERS, UnlockTierId, startUnlockCheckout } from '@/hooks/useRouteUnlock';

interface UnlockCardProps {
  tabName: string;
  otherTabs: string[];
  routeId: string;
  availableSlots: number;
  onRedeem: () => Promise<boolean>;
}

export const UnlockCard = ({ tabName, otherTabs, routeId, availableSlots, onRedeem }: UnlockCardProps) => {
  const { user } = useAuth();
  const [tier, setTier] = useState<UnlockTierId>('route_unlock_1');
  const [busy, setBusy] = useState(false);

  const selected = UNLOCK_TIERS.find(t => t.id === tier)!;

  const handleUnlock = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await startUnlockCheckout(tier, {
        userId: user.id,
        userEmail: user.email,
        routeId,
        returnPath: `/app/route/${routeId}`,
      });
    } catch (e: any) {
      toast.error(e.message || 'Could not start checkout');
      setBusy(false);
    }
  };

  const handleRedeem = async () => {
    setBusy(true);
    try {
      const ok = await onRedeem();
      if (ok) toast.success('Route unlocked!');
      else toast.error('No unlock slots left.');
    } catch (e: any) {
      toast.error(e.message || 'Could not unlock');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-[14px] bg-white p-6 shadow-[0_12px_40px_-12px_rgba(17,24,39,0.35)] border border-line">
      <div className="h-10 w-10 rounded-full bg-berkeley flex items-center justify-center mb-4">
        <Lock className="h-4 w-4 text-white" />
      </div>
      <h3 className="font-serifhead text-xl font-semibold text-ink">Unlock your {tabName}</h3>
      <p className="text-sm text-ink-soft mt-1">Plus {otherTabs.join(', ')} for this route.</p>

      {availableSlots > 0 ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-[10px] border border-berkeley bg-[#F3F8FC] p-4 text-sm text-ink">
            You have <strong>{availableSlots}</strong> unlock{availableSlots !== 1 ? 's' : ''} left from a pack — use one on this route for free.
          </div>
          <Button className="w-full bg-berkeley hover:bg-berkeley-deep text-white h-11" disabled={busy} onClick={handleRedeem}>
            Use 1 unlock on this route
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {UNLOCK_TIERS.map(t => {
              const active = t.id === tier;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t.id)}
                  className={`relative rounded-[10px] border p-3 text-center transition ${
                    active ? 'border-berkeley bg-[#F3F8FC]' : 'border-line bg-white hover:border-ink-soft/40'
                  }`}
                >
                  {t.best && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-ink">
                      BEST VALUE
                    </span>
                  )}
                  <span className="block text-xs text-ink-soft">{t.label}</span>
                  <span className="block font-serifhead text-xl font-semibold text-ink mt-1">${t.price}</span>
                </button>
              );
            })}
          </div>

          <Button className="mt-4 w-full h-11 bg-berkeley hover:bg-berkeley-deep text-white" disabled={busy} onClick={handleUnlock}>
            {busy ? 'Opening checkout…' : selected.cta}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-soft">One-time payment. No subscription.</p>
        </>
      )}
    </div>
  );
};
