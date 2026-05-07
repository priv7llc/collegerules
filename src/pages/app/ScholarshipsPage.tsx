import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Calendar, DollarSign, Loader2, Sparkles, UserCog } from 'lucide-react';
import { toast } from 'sonner';

interface MatchedScholarship {
  id: string;
  name: string;
  sponsor: string | null;
  amount_cents: number | null;
  deadline: string | null;
  description: string | null;
  external_url: string | null;
  match_score: number;
  match_reasons: string[];
  is_personal_discovery?: boolean;
}

type SortMode = 'best_match' | 'closing_soon' | 'highest_amount';

const ScholarshipsPage = () => {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState<MatchedScholarship[]>([]);
  const [completeness, setCompleteness] = useState<number | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high'>('all');
  const [sort, setSort] = useState<SortMode>('best_match');
  const [runsToday, setRunsToday] = useState<number>(0);
  const [discovering, setDiscovering] = useState(false);

  const remainingToday = Math.max(0, 5 - runsToday);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [{ data: matches }, { data: profile }, { data: runs }] = await Promise.all([
      supabase.rpc('match_scholarships_for_user', { _user_id: user.id }),
      supabase.from('scholarship_profiles').select('profile_completeness').eq('user_id', user.id).maybeSingle(),
      supabase.rpc('user_discovery_runs_today', { _user_id: user.id }),
    ]);
    setScholarships((matches as MatchedScholarship[]) || []);
    if (profile) {
      setHasProfile(true);
      setCompleteness(profile.profile_completeness ?? 0);
    }
    setRunsToday((runs as number) ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleDiscover = async () => {
    if (remainingToday === 0) {
      toast.error('Daily limit reached. Try again tomorrow.');
      return;
    }
    if (!hasProfile) {
      toast.error('Complete your scholarship profile first.');
      return;
    }
    setDiscovering(true);
    const tid = toast.loading('Searching the web for scholarships matching your profile... (30-90s)');
    try {
      const { data, error } = await supabase.functions.invoke('discover-scholarships-for-user', { body: {} });
      toast.dismiss(tid);
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const found = (data as any)?.discovered ?? 0;
      toast.success(found > 0 ? `Found ${found} new scholarships for you!` : 'Search complete — no new matches this round.');
      if (typeof (data as any)?.remainingToday === 'number') {
        setRunsToday(5 - (data as any).remainingToday);
      }
      await loadAll();
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err?.message || 'Discovery failed. Please try again.');
    } finally {
      setDiscovering(false);
    }
  };

  const sorted = useMemo(() => {
    const base = filter === 'high' ? scholarships.filter(s => s.match_score >= 70) : scholarships;
    return [...base].sort((a, b) => {
      if (sort === 'best_match') return b.match_score - a.match_score;
      if (sort === 'closing_soon') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      return (b.amount_cents ?? 0) - (a.amount_cents ?? 0);
    });
  }, [scholarships, filter, sort]);

  const fmtAmt = (c: number | null) => c ? `$${(c / 100).toLocaleString()}` : '—';
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : 'No deadline';

  const scoreVariant = (s: number) =>
    s >= 80 ? 'bg-success text-success-foreground'
    : s >= 60 ? 'bg-warning/80 text-warning-foreground'
    : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Scholarships</h1>
          <p className="text-muted-foreground">Personalized matches based on your profile.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscover} disabled={discovering || !hasProfile}>
              {discovering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Find more for me
            </Button>
            <Button variant="outline" asChild>
              <Link to="/app/scholarships/profile"><UserCog className="h-4 w-4 mr-2" />Edit Profile</Link>
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">{remainingToday} of 5 AI searches left today</span>
        </div>
      </div>

      {/* Profile completeness banners */}
      {!loading && (!hasProfile || (completeness ?? 0) < 50) && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 items-start">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Complete your scholarship profile to unlock personalized matches</p>
                <p className="text-sm text-muted-foreground">Takes about 5 minutes. Your information is private.</p>
              </div>
            </div>
            <Button asChild><Link to="/app/scholarships/profile">Complete Profile</Link></Button>
          </CardContent>
        </Card>
      )}
      {!loading && hasProfile && (completeness ?? 0) >= 50 && (completeness ?? 0) < 90 && (
        <Card className="bg-muted/40">
          <CardContent className="py-3 flex flex-wrap gap-3 items-center justify-between text-sm">
            <span>Your profile is <strong>{completeness}%</strong> complete. Add more details to improve matches.</span>
            <Button size="sm" variant="outline" asChild><Link to="/app/scholarships/profile">Edit Profile</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="py-4 flex items-center gap-3"><Award className="h-6 w-6 text-primary" /><div><div className="text-2xl font-bold">{scholarships.length}</div><div className="text-xs text-muted-foreground">Available</div></div></CardContent></Card>
        <Card><CardContent className="py-4 flex items-center gap-3"><Sparkles className="h-6 w-6 text-success" /><div><div className="text-2xl font-bold">{scholarships.filter(s => s.match_score >= 80).length}</div><div className="text-xs text-muted-foreground">Strong matches</div></div></CardContent></Card>
        <Card><CardContent className="py-4 flex items-center gap-3"><DollarSign className="h-6 w-6 text-primary" /><div><div className="text-2xl font-bold">{fmtAmt(scholarships.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0))}</div><div className="text-xs text-muted-foreground">Total available</div></div></CardContent></Card>
      </div>

      <p className="text-xs text-muted-foreground italic">
        Disclaimer: This tool surfaces matches but does not replace official counseling. Always verify scholarship details directly with the sponsor before applying.
      </p>

      {/* Filter + Sort */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="high">Strong matches (≥70)</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={sort} onValueChange={v => setSort(v as SortMode)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="best_match">Best Match</SelectItem>
            <SelectItem value="closing_soon">Closing Soon</SelectItem>
            <SelectItem value="highest_amount">Highest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : sorted.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No scholarships found.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map(s => (
            <Card key={s.id} className="relative hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <CardTitle className="font-display text-xl">
                      {s.is_personal_discovery && s.external_url ? (
                        <a href={s.external_url} target="_blank" rel="noreferrer" className="hover:text-primary">{s.name}</a>
                      ) : (
                        <Link to={`/app/scholarships/${s.id}`} className="hover:text-primary">{s.name}</Link>
                      )}
                    </CardTitle>
                    {s.sponsor && <CardDescription>{s.sponsor}</CardDescription>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={scoreVariant(s.match_score)}>{s.match_score}% match</Badge>
                    {s.is_personal_discovery && (
                      <Badge variant="outline" className="border-warning text-warning bg-warning/10">
                        AI-found · Unverified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                {s.is_personal_discovery && (
                  <p className="text-xs italic text-muted-foreground">
                    We found this through AI search using your profile. Always verify details on the official site before applying.
                  </p>
                )}
                {s.match_reasons?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Why this matches:</span> {s.match_reasons.join(' · ')}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm items-center">
                  <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-muted-foreground" />{fmtAmt(s.amount_cents)}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-muted-foreground" />{fmtDate(s.deadline)}</span>
                  {s.is_personal_discovery && s.external_url ? (
                    <Button size="sm" asChild className="ml-auto">
                      <a href={s.external_url} target="_blank" rel="noreferrer">Visit Site</a>
                    </Button>
                  ) : (
                    <Button size="sm" asChild className="ml-auto">
                      <Link to={`/app/scholarships/${s.id}`}>View & Apply</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScholarshipsPage;
