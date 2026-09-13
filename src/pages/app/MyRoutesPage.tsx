import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, CreditCard, FolderOpen, Lock, Unlock, ArrowRight, Infinity as InfinityIcon } from 'lucide-react';
import { toast } from 'sonner';
import { systemLabel } from '@/lib/transferOptions';

interface RouteRecord {
  id: string;
  route_name: string | null;
  community_college: string | null;
  major: string | null;
  destination_university: string | null;
  destination_program: string | null;
  status: string;
  updated_at: string;
}

const formatDestination = (sys: string | null, program: string | null, major: string | null): string => {
  const label = systemLabel(sys);
  const p = (program || '').trim();
  if (!p) return label;
  const isPlaceholder = /^.+\s(AS-T|AA-T|AA|AS|AAT|AAS|Core|Transfer)$/i.test(p) && major && p.toLowerCase().startsWith(major.toLowerCase());
  if (isPlaceholder) return label;
  return `${label} — ${p}`;
};

const statusPill: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-surfacebase text-ink-soft border-line' },
  processing: { label: 'Building', cls: 'bg-[#FFF7E6] text-[#9A6B00] border-[#F3DFAE]' },
  ready: { label: 'Ready', cls: 'bg-[#ECFDF3] text-successgreen border-[#C6F0D5]' },
  needs_review: { label: 'Needs review', cls: 'bg-[#FEF2F2] text-urgent border-[#F7CFCF]' },
  archived: { label: 'Archived', cls: 'bg-surfacebase text-ink-soft border-line' },
};

const MyRoutesPage = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [unlimited, setUnlimited] = useState(false);
  const [slots, setSlots] = useState(0);
  const [used, setUsed] = useState(0);
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: routeData }, { data: summary }, { data: unlockRows }, { data: courseRows }] = await Promise.all([
      supabase.from('routes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.rpc('unlock_summary', { _user_id: user.id }),
      supabase.from('route_unlocks').select('route_id').eq('user_id', user.id).not('route_id', 'is', null),
      supabase.from('course_progress').select('route_id,status'),
    ]);

    setRoutes((routeData as RouteRecord[]) || []);
    const s: any = Array.isArray(summary) ? summary[0] : summary;
    setUnlimited(!!s?.unlimited);
    setSlots(s?.available ?? 0);
    setUsed(s?.used ?? 0);
    setUnlockedIds(new Set((unlockRows || []).map((r: any) => r.route_id)));

    const p: Record<string, { done: number; total: number }> = {};
    (courseRows || []).forEach((r: any) => {
      p[r.route_id] = p[r.route_id] || { done: 0, total: 0 };
      p[r.route_id].total += 1;
      if (r.status === 'completed') p[r.route_id].done += 1;
    });
    setProgress(p);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user || searchParams.get('payment') !== 'success') return;
    const verify = async () => {
      try {
        const { data } = await supabase.functions.invoke('verify-payment');
        if (data?.unlocked > 0) toast.success('Unlock applied!');
        else toast.info('Payment received — already applied.');
      } catch {
        toast.error('Could not verify payment. It may take a moment to appear.');
      }
      setSearchParams({}, { replace: true });
      loadData();
    };
    verify();
  }, [user, searchParams, setSearchParams, loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-berkeley" /></div>;

  return (
    <div className="space-y-6 animate-fade-in font-plex text-ink">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serifhead text-2xl font-semibold">My Transfer Routes</h1>
          <p className="text-ink-soft text-sm">Every route you've planned, in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-soft">
            <CreditCard className="h-3.5 w-3.5" />{credits} route credit{credits !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-soft">
            {unlimited ? <><InfinityIcon className="h-3.5 w-3.5 text-successgreen" />Unlimited unlocks</> : <><Unlock className="h-3.5 w-3.5" />{slots} unlock{slots !== 1 ? 's' : ''} left</>}
          </span>
          <Button asChild className="bg-berkeley hover:bg-berkeley-deep text-white">
            <Link to={credits > 0 ? '/app/create' : '/app/buy-credits'}>
              <PlusCircle className="h-4 w-4 mr-2" />{credits > 0 ? 'Create Route' : 'Buy Credits'}
            </Link>
          </Button>
        </div>
      </div>

      {routes.length === 0 ? (
        <Card className="border-dashed border-line bg-white">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-ink-soft/50 mb-4" />
            <h3 className="font-serifhead text-lg font-semibold mb-2">No routes yet</h3>
            <p className="text-ink-soft text-sm mb-4 text-center max-w-sm">
              {credits > 0
                ? 'Create your first transfer route to get a personalized dashboard.'
                : 'Purchase route credits to get started with your transfer planning.'}
            </p>
            <Button asChild className="bg-berkeley hover:bg-berkeley-deep text-white">
              <Link to={credits > 0 ? '/app/create' : '/app/buy-credits'}>{credits > 0 ? 'Create Your First Route' : 'View Pricing'}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routes.map(route => {
            const isUnlocked = unlimited || unlockedIds.has(route.id);
            const pill = statusPill[route.status] || statusPill.draft;
            const prog = progress[route.id];
            const pct = prog && prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;

            return (
              <Link
                key={route.id}
                to={`/app/route/${route.id}`}
                className="group rounded-[10px] border border-line bg-white p-5 transition hover:border-berkeley/40 hover:shadow-[0_8px_24px_-14px_rgba(17,24,39,0.4)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serifhead text-base font-semibold leading-snug line-clamp-2">
                    {route.route_name || `${route.community_college} → ${systemLabel(route.destination_university)}`}
                  </h3>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${pill.cls}`}>{pill.label}</span>
                </div>

                <dl className="mt-3 space-y-1 text-sm text-ink-soft">
                  <div><span className="font-medium text-ink">From:</span> {route.community_college}</div>
                  <div><span className="font-medium text-ink">Major:</span> {route.major}</div>
                  <div><span className="font-medium text-ink">To:</span> {formatDestination(route.destination_university, route.destination_program, route.major)}</div>
                </dl>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-ink-soft mb-1">
                    <span>Course progress</span>
                    <span>{prog ? `${prog.done}/${prog.total}` : '0/0'}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surfacebase overflow-hidden">
                    <div className="h-full rounded-full bg-successgreen transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${isUnlocked ? 'text-successgreen' : 'text-ink-soft'}`}>
                    {isUnlocked ? <><Unlock className="h-3.5 w-3.5" />Fully unlocked</> : <><Lock className="h-3.5 w-3.5" />Locked sections</>}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-berkeley group-hover:gap-1.5 transition-all">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}

          <Link
            to={credits > 0 ? '/app/create' : '/app/buy-credits'}
            className="flex min-h-[200px] flex-col items-center justify-center rounded-[10px] border border-dashed border-line bg-white/60 p-5 text-center transition hover:border-berkeley/50 hover:bg-white"
          >
            <PlusCircle className="h-7 w-7 text-berkeley mb-2" />
            <span className="font-serifhead text-base font-semibold">Add another route</span>
            <span className="text-xs text-ink-soft mt-1">{credits > 0 ? `${credits} credit${credits !== 1 ? 's' : ''} available` : 'Buy a credit to plan another transfer'}</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyRoutesPage;
