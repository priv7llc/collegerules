import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Calendar, DollarSign, ExternalLink, Sparkles, UserCog } from 'lucide-react';

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

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ data: matches }, { data: profile }] = await Promise.all([
        supabase.rpc('match_scholarships_for_user', { _user_id: user.id }),
        supabase.from('scholarship_profiles').select('profile_completeness').eq('user_id', user.id).maybeSingle(),
      ]);
      setScholarships((matches as MatchedScholarship[]) || []);
      if (profile) {
        setHasProfile(true);
        setCompleteness(profile.profile_completeness ?? 0);
      }
      setLoading(false);
    };
    load();
  }, [user]);

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
        <Button variant="outline" asChild>
          <Link to="/app/scholarships/profile"><UserCog className="h-4 w-4 mr-2" />Edit Profile</Link>
        </Button>
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
            <Card key={s.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <CardTitle className="font-display text-xl">{s.name}</CardTitle>
                    {s.sponsor && <CardDescription>{s.sponsor}</CardDescription>}
                  </div>
                  <Badge className={scoreVariant(s.match_score)}>{s.match_score}% match</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                {s.match_reasons?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Why this matches:</span> {s.match_reasons.join(' · ')}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-muted-foreground" />{fmtAmt(s.amount_cents)}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-muted-foreground" />{fmtDate(s.deadline)}</span>
                  {s.external_url && (
                    <a href={s.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline ml-auto">
                      Apply <ExternalLink className="h-3 w-3" />
                    </a>
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
