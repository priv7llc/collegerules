import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle, ArrowRight, Award, CheckCircle2, ClipboardList, Sparkles, UserCog, Wallet,
} from 'lucide-react';

interface UniversityCost {
  id: string;
  university_name: string;
  system: string | null;
  tuition_cents: number;
  housing_food_cents: number | null;
  books_supplies_cents: number | null;
  transportation_cents: number | null;
  personal_misc_cents: number | null;
  total_cost_cents: number;
  catalog_year: string | null;
}

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

const INCOME_TO_FAMILY: Record<string, number> = {
  under_30k: 0,
  '30k_60k': 300000,
  '60k_100k': 800000,
  '100k_plus': 1500000,
};

export const AffordabilityTab = ({
  routeId, destinationUniversity,
}: { routeId: string; destinationUniversity: string }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [cost, setCost] = useState<UniversityCost | null>(null);
  const [costFallback, setCostFallback] = useState<'exact' | 'system' | 'fallback' | 'final'>('exact');
  const [apps, setApps] = useState<any[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const [{ data: prof }, { data: appData }] = await Promise.all([
        supabase.from('scholarship_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('scholarship_applications').select('*, scholarship:scholarships(*)').eq('user_id', user.id),
      ]);
      setProfile(prof);
      setApps(appData || []);

      // Find university_costs row
      let foundCost: UniversityCost | null = null;
      let mode: 'exact' | 'system' | 'fallback' | 'final' = 'exact';
      const target = (destinationUniversity || '').trim();

      if (target) {
        const { data: exact } = await supabase
          .from('university_costs').select('*')
          .ilike('university_name', target).limit(1);
        if (exact && exact.length) foundCost = exact[0] as any;

        if (!foundCost) {
          const { data: like } = await supabase
            .from('university_costs').select('*')
            .ilike('university_name', `%${target}%`).limit(1);
          if (like && like.length) { foundCost = like[0] as any; mode = 'system'; }
        }
      }

      if (!foundCost) {
        const targetUpper = target.toUpperCase();
        const sysName = targetUpper.includes('UC') || targetUpper.includes('UNIVERSITY OF CALIFORNIA')
          ? 'UC System'
          : targetUpper.includes('CSU') || targetUpper.includes('CALIFORNIA STATE')
            ? 'CSU System'
            : null;
        if (sysName) {
          const { data: sys } = await supabase
            .from('university_costs').select('*').eq('university_name', sysName).maybeSingle();
          if (sys) { foundCost = sys as any; mode = 'fallback'; }
        }
      }

      if (!foundCost) {
        foundCost = {
          id: 'fallback', university_name: target || 'University',
          system: null, tuition_cents: 0, housing_food_cents: 0, books_supplies_cents: 0,
          transportation_cents: 0, personal_misc_cents: 0,
          total_cost_cents: 3000000, catalog_year: '2025-2026',
        };
        mode = 'final';
      }
      setCost(foundCost);
      setCostFallback(mode);

      // Matched scholarships count via RPC
      try {
        const { data: matched } = await supabase.rpc('match_scholarships_for_user', { _user_id: user.id });
        const totalMatched = Array.isArray(matched) ? matched.length : 0;
        const appliedCount = (appData || []).length;
        setMatchedCount(Math.max(0, totalMatched - appliedCount));
      } catch { setMatchedCount(0); }

      setLoading(false);
    };
    load();
  }, [user, destinationUniversity]);

  if (loading || !cost) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const won = apps.filter(a => a.status === 'won')
    .reduce((s, a) => s + (a.amount_won_cents || 0), 0);
  const pendingValue = apps.filter(a => a.status === 'submitted' || a.status === 'in_progress')
    .reduce((s, a) => s + (a.scholarship?.amount_cents || 0), 0);
  const pellEstimate = profile?.pell_grant_eligible ? 739500 : 0;
  const familyContribution = profile?.expected_family_contribution_cents != null
    ? profile.expected_family_contribution_cents
    : (INCOME_TO_FAMILY[profile?.household_income_range] ?? 0);

  const conservativeFunding = won + pellEstimate + familyContribution;
  const optimisticFunding = conservativeFunding + pendingValue;
  const conservativeGap = Math.max(0, cost.total_cost_cents - conservativeFunding);
  const optimisticGap = Math.max(0, cost.total_cost_cents - optimisticFunding);

  const total = cost.total_cost_cents || 1;
  const segments = [
    { label: 'Won', value: won, cls: 'bg-success' },
    { label: 'Pell Grant (est.)', value: pellEstimate, cls: 'bg-primary' },
    { label: 'Family contribution', value: familyContribution, cls: 'bg-muted-foreground/40' },
    { label: 'Pending applications', value: Math.min(pendingValue, Math.max(0, total - conservativeFunding)), cls: 'bg-warning/70' },
    { label: 'Funding gap', value: conservativeGap, cls: 'bg-destructive' },
  ];

  const noProfile = !profile;

  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        These estimates help you plan — they are not financial aid offers. Always confirm costs and aid with the campus financial aid office.
      </p>

      {noProfile && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">Build your scholarship profile to see your full affordability picture.</p>
            <Button asChild size="sm"><Link to="/app/scholarships/profile">Build profile</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Card 1 — Cost of Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Annual Cost of Attendance</CardTitle>
          <CardDescription>
            {cost.university_name} <span className="text-muted-foreground">· {cost.catalog_year}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-4xl font-display font-bold">{fmt(cost.total_cost_cents)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <Row label="Tuition & Fees" value={cost.tuition_cents} />
            <Row label="Housing & Food" value={cost.housing_food_cents} />
            <Row label="Books & Supplies" value={cost.books_supplies_cents} />
            <Row label="Transportation" value={cost.transportation_cents} />
            <Row label="Personal & Misc" value={cost.personal_misc_cents} />
          </div>
          <p className="text-xs text-muted-foreground">
            Estimates based on {cost.catalog_year} published data. Actual costs vary.
          </p>
          {(costFallback === 'fallback' || costFallback === 'final') && (
            <div className="text-xs text-warning-foreground bg-warning/10 border border-warning/30 rounded-md p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
              <div>
                We're estimating across {cost.system || 'this system'} — set a specific campus on your route for accuracy.{' '}
                <Link to={`/app/route/${routeId}`} className="underline">View route</Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card 2 — Funding Snapshot */}
      {!noProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Where your funding stands</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                {conservativeGap === 0 ? (
                  <>
                    <p className="text-2xl font-display font-bold text-success">You're fully funded!</p>
                    <p className="text-xs text-muted-foreground mt-1">Anything from pending applications is bonus.</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-display font-bold text-destructive">You still need {fmt(conservativeGap)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Conservative — counts only what you've already won.</p>
                  </>
                )}
              </div>
              <div>
                <p className="text-base font-medium text-muted-foreground">If all pending applications win: {fmt(optimisticGap)}</p>
                <p className="text-xs text-muted-foreground mt-1">Optimistic — assumes all pending apps come through.</p>
              </div>
            </div>

            {/* Stacked bar */}
            <div className="w-full h-6 rounded-full overflow-hidden flex bg-muted">
              {segments.filter(s => s.value > 0).map((s, i) => {
                const pct = (s.value / total) * 100;
                return <div key={i} className={s.cls} style={{ width: `${pct}%` }} title={`${s.label}: ${fmt(s.value)}`} />;
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {segments.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-sm ${s.cls}`} />
                  <span className="flex-1 text-muted-foreground">{s.label}</span>
                  <span className="font-medium">{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 3 — What to do next */}
      {!noProfile && (
        <Card className={conservativeGap === 0 ? 'border-success bg-success/5' : ''}>
          <CardContent className="py-6 space-y-3">
            {conservativeGap === 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <h3 className="font-display text-lg font-semibold">You're fully funded for {cost.university_name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">Anything you win from pending applications is bonus.</p>
                <Button asChild><Link to="/app/applications">Submit pending applications <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg font-semibold">You still need {fmt(conservativeGap)} per year</h3>
                <p className="text-sm text-muted-foreground">
                  Apply to more scholarships to close the gap. With your profile, you have {matchedCount} matched scholarships not yet applied to.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild><Link to="/app/scholarships"><Sparkles className="h-4 w-4 mr-1" />Find more scholarships</Link></Button>
                  <Button variant="outline" asChild><Link to="/app/scholarships/profile"><UserCog className="h-4 w-4 mr-1" />Update your financial profile</Link></Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card 4 — Quick links */}
      <Card className="bg-muted/30">
        <CardContent className="py-4 flex flex-wrap gap-2 justify-center">
          <Button variant="ghost" size="sm" asChild><Link to="/app/applications"><ClipboardList className="h-4 w-4 mr-1" />View all applications</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/app/scholarships"><Award className="h-4 w-4 mr-1" />Browse scholarships</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/app/scholarships/profile"><UserCog className="h-4 w-4 mr-1" />Edit my profile</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: number | null }) => (
  <div className="flex justify-between border-b border-border/50 py-1.5">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value != null ? fmt(value) : '—'}</span>
  </div>
);
