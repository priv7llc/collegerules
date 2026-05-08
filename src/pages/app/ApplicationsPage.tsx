import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Award, Calendar, ClipboardList, DollarSign, FolderOpen, Loader2,
  Send, Trophy, XCircle,
} from 'lucide-react';

type Status = 'saved' | 'in_progress' | 'submitted' | 'won' | 'lost';

interface AppRow {
  id: string;
  status: Status;
  notes: string | null;
  submitted_at: string | null;
  amount_won_cents: number | null;
  updated_at: string;
  scholarship: {
    id: string; name: string; sponsor: string | null;
    amount_cents: number | null; deadline: string | null;
  } | null;
}

const fmtAmt = (c: number | null | undefined) => (c ? `$${(c / 100).toLocaleString()}` : '—');
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : 'No deadline');

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const COLUMNS: { status: Status; label: string; tint: string }[] = [
  { status: 'saved', label: 'Saved', tint: 'bg-muted/40' },
  { status: 'in_progress', label: 'In Progress', tint: 'bg-accent/10' },
  { status: 'submitted', label: 'Submitted', tint: 'bg-primary/5' },
  { status: 'won', label: 'Won', tint: 'bg-success/10' },
  { status: 'lost', label: 'Not Selected', tint: 'bg-destructive/5' },
];

const ApplicationsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AppRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('scholarship_applications')
        .select('*, scholarship:scholarships(*)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (!error) setRows((data as any as AppRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const buckets = useMemo(() => {
    const m: Record<Status, AppRow[]> = {
      saved: [], in_progress: [], submitted: [], won: [], lost: [],
    };
    rows.forEach((r) => m[r.status]?.push(r));
    return m;
  }, [rows]);

  const activeCount = buckets.saved.length + buckets.in_progress.length;
  const submittedCount = buckets.submitted.length;
  const wonCount = buckets.won.length;
  const totalWon = buckets.won.reduce(
    (sum, r) => sum + (r.amount_won_cents || r.scholarship?.amount_cents || 0),
    0,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track every scholarship you've saved, applied to, or won
          </p>
        </div>
        <Button asChild>
          <Link to="/app/scholarships">
            <Award className="h-4 w-4 mr-2" />Browse Scholarships
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderOpen} label="Active" value={activeCount} sub="Open applications" />
        <StatCard icon={Send} label="Submitted" value={submittedCount} sub="Awaiting decision" />
        <StatCard icon={Trophy} label="Won" value={wonCount} sub="Scholarships earned" tone="success" />
        <StatCard icon={DollarSign} label="Total Awarded" value={fmtAmt(totalWon)} sub="From won scholarships" tone="success" />
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading your applications...
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" />
            <h2 className="font-display text-xl">No applications yet</h2>
            <p className="text-muted-foreground">Save scholarships and start applications to track them here.</p>
            <Button asChild>
              <Link to="/app/scholarships">Browse Scholarships</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              label={col.label}
              tint={col.tint}
              items={buckets[col.status]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({
  icon: Icon, label, value, sub, tone,
}: {
  icon: any; label: string; value: number | string; sub: string; tone?: 'success';
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-3xl font-display font-bold mt-1 ${tone === 'success' ? 'text-success' : ''}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <Icon className={`h-5 w-5 ${tone === 'success' ? 'text-success' : 'text-muted-foreground'}`} />
      </div>
    </CardContent>
  </Card>
);

const KanbanColumn = ({
  label, tint, items,
}: {
  label: string; tint: string; items: AppRow[];
}) => (
  <div className={`rounded-lg border ${tint} p-3 space-y-3 min-h-[200px]`}>
    <div className="flex items-center justify-between px-1">
      <h3 className="font-display font-semibold text-sm uppercase tracking-wide">{label}</h3>
      <Badge variant="secondary">{items.length}</Badge>
    </div>
    {items.length === 0 ? (
      <p className="text-xs text-muted-foreground text-center py-6">Nothing here yet</p>
    ) : (
      items.map((item) => <AppCard key={item.id} item={item} />)
    )}
  </div>
);

const AppCard = ({ item }: { item: AppRow }) => {
  const s = item.scholarship;
  const days = daysUntil(s?.deadline ?? null);
  const isUrgent = days != null && days >= 0 && days <= 7 && (item.status === 'saved' || item.status === 'in_progress');
  const isOverdue = days != null && days < 0 && (item.status === 'saved' || item.status === 'in_progress');
  const isEditable = item.status === 'saved' || item.status === 'in_progress';

  const inner = (
    <Card className={`transition-shadow ${s ? 'hover:shadow-md hover:border-primary/40 cursor-pointer' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm leading-snug">
          {s ? s.name : <span className="text-muted-foreground">Scholarship removed</span>}
        </CardTitle>
        {s?.sponsor && <p className="text-xs text-muted-foreground">{s.sponsor}</p>}
      </CardHeader>
      <CardContent className="pt-0 space-y-2 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {item.status === 'won' ? fmtAmt(item.amount_won_cents || s?.amount_cents) : fmtAmt(s?.amount_cents)}
          </span>
          {s?.deadline && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : isUrgent ? 'text-warning' : ''}`}>
              <Calendar className="h-3 w-3" />
              {isOverdue ? 'Past due' : days != null && days >= 0 ? `${days}d left` : fmtDate(s.deadline)}
            </span>
          )}
        </div>
        {item.status === 'submitted' && item.submitted_at && (
          <p className="text-muted-foreground">Submitted {new Date(item.submitted_at).toLocaleDateString()}</p>
        )}
        {item.status === 'won' && (
          <Badge variant="default" className="bg-success text-success-foreground">
            <Trophy className="h-3 w-3 mr-1" />Won
          </Badge>
        )}
        {item.status === 'lost' && (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="h-3 w-3 mr-1" />Not selected
          </Badge>
        )}
        {s && isEditable && (
          <div className="pt-1 flex items-center justify-between text-primary font-medium">
            <span>{item.status === 'in_progress' ? 'Continue editing' : 'Open & start'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        )}
        {s && !isEditable && (
          <div className="pt-1 flex items-center justify-between text-muted-foreground">
            <span>View details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return s ? (
    <Link to={`/app/scholarships/${s.id}`} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
};

export default ApplicationsPage;
