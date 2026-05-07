import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Sparkles, Pencil, Check, X } from 'lucide-react';

type Scholarship = {
  id: string;
  name: string;
  sponsor: string | null;
  amount_cents: number;
  deadline: string | null;
  description: string | null;
  external_url: string | null;
  eligibility_criteria: any;
  essay_prompts: any;
  active: boolean;
};

type Candidate = {
  id: string;
  name: string;
  sponsor: string | null;
  amount_cents: number | null;
  deadline: string | null;
  description: string | null;
  external_url: string | null;
  source_url: string | null;
  source_query: string | null;
  confidence_score: number | null;
  eligibility_criteria: any;
  essay_prompts: any;
  status: string;
};

const fmtMoney = (cents?: number | null) =>
  cents == null ? '—' : `$${(cents / 100).toLocaleString()}`;

const emptyScholarship = (): Partial<Scholarship> => ({
  name: '',
  sponsor: '',
  amount_cents: 0,
  deadline: null,
  description: '',
  external_url: '',
  eligibility_criteria: {},
  essay_prompts: [],
  active: true,
});

export default function AdminScholarshipsPage() {
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const [editScholarship, setEditScholarship] = useState<Partial<Scholarship> | null>(null);
  const [editCandidate, setEditCandidate] = useState<Candidate | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadAll() {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([
      supabase.from('scholarships').select('*').order('created_at', { ascending: false }),
      supabase.from('scholarship_candidates').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);
    if (sRes.error) toast.error('Failed to load scholarships');
    else setScholarships(sRes.data as Scholarship[]);
    if (cRes.error) toast.error('Failed to load candidates');
    else setCandidates(cRes.data as Candidate[]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function runDiscovery() {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('discover-scholarships', { body: {} });
      if (error) throw error;
      toast.success(`Discovery started for ${data?.categories ?? '?'} categories. Results will appear shortly.`);
      setTimeout(() => loadAll(), 8000);
    } catch (err: any) {
      toast.error(`Discovery failed: ${err?.message || 'unknown error'}`);
    } finally {
      setRunning(false);
    }
  }

  async function saveScholarship() {
    if (!editScholarship) return;
    const payload: any = {
      name: editScholarship.name,
      sponsor: editScholarship.sponsor,
      amount_cents: Number(editScholarship.amount_cents) || 0,
      deadline: editScholarship.deadline || null,
      description: editScholarship.description || null,
      external_url: editScholarship.external_url || null,
      eligibility_criteria: editScholarship.eligibility_criteria || {},
      essay_prompts: editScholarship.essay_prompts || [],
      active: editScholarship.active ?? true,
    };
    const res = editScholarship.id
      ? await supabase.from('scholarships').update(payload).eq('id', editScholarship.id)
      : await supabase.from('scholarships').insert(payload);
    if (res.error) toast.error(res.error.message);
    else {
      toast.success('Saved');
      setEditScholarship(null);
      loadAll();
    }
  }

  async function toggleActive(s: Scholarship) {
    const { error } = await supabase.from('scholarships').update({ active: !s.active }).eq('id', s.id);
    if (error) toast.error(error.message);
    else { toast.success(s.active ? 'Deactivated' : 'Activated'); loadAll(); }
  }

  async function approveCandidate(c: Candidate, overrides?: Partial<Candidate>) {
    const data = { ...c, ...overrides };
    const insertRes = await supabase.from('scholarships').insert({
      name: data.name,
      sponsor: data.sponsor,
      amount_cents: data.amount_cents ?? 0,
      deadline: data.deadline,
      description: data.description,
      external_url: data.external_url,
      eligibility_criteria: data.eligibility_criteria || {},
      essay_prompts: data.essay_prompts || [],
      active: true,
    });
    if (insertRes.error) {
      toast.error(`Approve failed: ${insertRes.error.message}`);
      return;
    }
    const updRes = await supabase
      .from('scholarship_candidates')
      .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', c.id);
    if (updRes.error) toast.error(updRes.error.message);
    else { toast.success('Approved & added to catalog'); setEditCandidate(null); loadAll(); }
  }

  async function rejectCandidate() {
    if (!rejectingId) return;
    const { error } = await supabase
      .from('scholarship_candidates')
      .update({
        status: 'rejected',
        rejection_reason: rejectReason || null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', rejectingId);
    if (error) toast.error(error.message);
    else { toast.success('Rejected'); setRejectingId(null); setRejectReason(''); loadAll(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">Scholarships</h1>
        <p className="text-muted-foreground mt-1">Manage the scholarship catalog and review AI-discovered candidates.</p>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalog ({scholarships.length})</TabsTrigger>
          <TabsTrigger value="queue">
            Review Queue {candidates.length > 0 && <Badge variant="secondary" className="ml-2">{candidates.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setEditScholarship(emptyScholarship())}>+ Add Manually</Button>
          </div>
          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="inline h-4 w-4 animate-spin" /></TableCell></TableRow>
                ) : scholarships.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No scholarships yet</TableCell></TableRow>
                ) : scholarships.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.sponsor || '—'}</TableCell>
                    <TableCell>{fmtMoney(s.amount_cents)}</TableCell>
                    <TableCell>{s.deadline || '—'}</TableCell>
                    <TableCell>{s.active ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setEditScholarship(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>{s.active ? 'Deactivate' : 'Activate'}</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{candidates.length} pending candidates</p>
            <Button onClick={runDiscovery} disabled={running} size="lg">
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {running ? 'Running…' : 'Run Discovery Now'}
            </Button>
          </div>
          <div className="border rounded-md bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Sponsor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="inline h-4 w-4 animate-spin" /></TableCell></TableRow>
                ) : candidates.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No pending candidates. Run discovery to find more.</TableCell></TableRow>
                ) : candidates.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-xs">{c.name}</TableCell>
                    <TableCell>{c.sponsor || '—'}</TableCell>
                    <TableCell>{fmtMoney(c.amount_cents)}</TableCell>
                    <TableCell>{c.deadline || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={(c.confidence_score ?? 0) >= 0.8 ? 'default' : 'secondary'}>
                        {((c.confidence_score ?? 0) * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {c.source_url ? <a href={c.source_url} target="_blank" rel="noreferrer" className="text-accent underline text-xs">{c.source_url}</a> : '—'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" onClick={() => approveCandidate(c)}><Check className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setEditCandidate(c)}><Pencil className="h-3 w-3" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => { setRejectingId(c.id); setRejectReason(''); }}><X className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Scholarship Dialog */}
      <Dialog open={!!editScholarship} onOpenChange={(o) => !o && setEditScholarship(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editScholarship?.id ? 'Edit Scholarship' : 'Add Scholarship'}</DialogTitle></DialogHeader>
          {editScholarship && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editScholarship.name || ''} onChange={e => setEditScholarship({ ...editScholarship, name: e.target.value })} /></div>
              <div><Label>Sponsor</Label><Input value={editScholarship.sponsor || ''} onChange={e => setEditScholarship({ ...editScholarship, sponsor: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount (cents)</Label><Input type="number" value={editScholarship.amount_cents ?? 0} onChange={e => setEditScholarship({ ...editScholarship, amount_cents: parseInt(e.target.value || '0') })} /></div>
                <div><Label>Deadline (YYYY-MM-DD)</Label><Input value={editScholarship.deadline || ''} onChange={e => setEditScholarship({ ...editScholarship, deadline: e.target.value })} /></div>
              </div>
              <div><Label>External URL</Label><Input value={editScholarship.external_url || ''} onChange={e => setEditScholarship({ ...editScholarship, external_url: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editScholarship.description || ''} onChange={e => setEditScholarship({ ...editScholarship, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditScholarship(null)}>Cancel</Button>
            <Button onClick={saveScholarship}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit-then-Approve Candidate Dialog */}
      <Dialog open={!!editCandidate} onOpenChange={(o) => !o && setEditCandidate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit & Approve Candidate</DialogTitle></DialogHeader>
          {editCandidate && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editCandidate.name} onChange={e => setEditCandidate({ ...editCandidate, name: e.target.value })} /></div>
              <div><Label>Sponsor</Label><Input value={editCandidate.sponsor || ''} onChange={e => setEditCandidate({ ...editCandidate, sponsor: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount (cents)</Label><Input type="number" value={editCandidate.amount_cents ?? 0} onChange={e => setEditCandidate({ ...editCandidate, amount_cents: parseInt(e.target.value || '0') })} /></div>
                <div><Label>Deadline</Label><Input value={editCandidate.deadline || ''} onChange={e => setEditCandidate({ ...editCandidate, deadline: e.target.value })} /></div>
              </div>
              <div><Label>External URL</Label><Input value={editCandidate.external_url || ''} onChange={e => setEditCandidate({ ...editCandidate, external_url: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editCandidate.description || ''} onChange={e => setEditCandidate({ ...editCandidate, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCandidate(null)}>Cancel</Button>
            <Button onClick={() => editCandidate && approveCandidate(editCandidate)}>Save & Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Candidate</DialogTitle></DialogHeader>
          <div><Label>Reason (optional)</Label><Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Why is this being rejected?" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={rejectCandidate}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
