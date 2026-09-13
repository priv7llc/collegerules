import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { WRITER_TIERS, WriterTierId, startWriterCheckout } from '@/hooks/useWriterUnlock';

interface Props {
  returnPath?: string;
}

const WriterUnlockCard = ({ returnPath }: Props) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<WriterTierId>('writer_unlock_3mo');
  const [busy, setBusy] = useState(false);
  const tier = WRITER_TIERS.find(t => t.id === selected)!;

  const go = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await startWriterCheckout(selected, {
        userId: user.id,
        userEmail: user.email,
        returnPath: returnPath || window.location.pathname,
      });
    } catch (e: any) {
      toast.error(e.message || 'Could not start checkout');
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[14px] bg-white border border-line shadow-lg p-6 text-center">
      <div className="mx-auto h-10 w-10 rounded-full bg-berkeley flex items-center justify-center">
        <Lock className="h-5 w-5 text-white" />
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-ink">Unlock the Scholarship Writer</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Your draft is saved — unlock AI writing tools to improve, shorten, and strengthen it for
        every scholarship you apply to.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {WRITER_TIERS.map(t => {
          const on = t.id === selected;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={`relative rounded-lg border-2 py-3 px-2 transition-colors ${
                on ? 'border-berkeley bg-[#F3F8FC]' : 'border-line bg-white hover:border-berkeley/40'
              }`}
            >
              {t.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink">
                  Most popular
                </span>
              )}
              <div className="text-xs font-medium text-ink-soft">{t.label}</div>
              <div className="font-display text-lg font-bold text-ink">${t.price}</div>
            </button>
          );
        })}
      </div>

      <Button onClick={go} disabled={busy} className="mt-5 w-full bg-berkeley hover:bg-berkeley-deep text-white">
        {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {tier.cta}
      </Button>
      <p className="mt-2 text-xs text-ink-soft">
        No subscription. You're charged once, access expires automatically.
      </p>
    </div>
  );
};

export default WriterUnlockCard;
