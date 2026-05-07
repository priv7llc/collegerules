import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  ArrowLeft, Calendar, CheckCircle2, DollarSign, ExternalLink, FileText,
  Loader2, Save, Sparkles, Trophy, XCircle, AlertTriangle, PartyPopper,
  Minus, Plus, Zap, RefreshCw,
} from 'lucide-react';

type Status = 'saved' | 'in_progress' | 'submitted' | 'won' | 'lost';

interface Scholarship {
  id: string; name: string; sponsor: string | null; amount_cents: number | null;
  deadline: string | null; description: string | null; external_url: string | null;
  eligibility_criteria: any; essay_prompts: any;
}
interface Application {
  id: string; status: Status; notes: string | null; submitted_at: string | null;
  amount_won_cents: number | null;
}
interface Essay {
  id: string; title: string | null; prompt: string | null; content: string | null;
  word_count: number | null; tone: string | null;
}

const fmtAmt = (c: number | null) => c ? `$${(c / 100).toLocaleString()}` : '—';
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : 'No deadline';

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function evaluateEligibility(crit: any, profile: any, gpa: number | null) {
  const checks: { label: string; ok: boolean | null }[] = [];
  if (!crit || typeof crit !== 'object') return checks;
  const minGpa = crit.min_gpa ? Number(crit.min_gpa) : null;
  if (minGpa != null) checks.push({ label: `GPA ≥ ${minGpa}`, ok: gpa != null ? gpa >= minGpa : null });
  if (Array.isArray(crit.states) && crit.states.length) {
    checks.push({ label: `State: ${crit.states.join(', ')}`, ok: profile?.state_of_residence ? crit.states.includes(profile.state_of_residence) : null });
  }
  if (Array.isArray(crit.ethnicities) && crit.ethnicities.length) {
    checks.push({ label: `Ethnicity: ${crit.ethnicities.join('/')}`, ok: profile?.ethnicities ? profile.ethnicities.some((e: string) => crit.ethnicities.includes(e)) : null });
  }
  if (crit.gender) checks.push({ label: `Gender: ${crit.gender}`, ok: profile?.gender ? profile.gender.toLowerCase() === String(crit.gender).toLowerCase() : null });
  if (crit.first_generation === true || crit.first_gen === true) checks.push({ label: 'First-generation student', ok: profile?.first_generation_college ?? null });
  if (crit.pell_eligible === true) checks.push({ label: 'Pell Grant eligible', ok: profile?.pell_grant_eligible ?? null });
  if (crit.transfer_status) checks.push({ label: `Transfer status: ${crit.transfer_status}`, ok: null });
  if (Array.isArray(crit.majors) && crit.majors.length) {
    const m = profile?.intended_major?.toLowerCase() || '';
    checks.push({ label: `Major: ${crit.majors.join(', ')}`, ok: m ? crit.majors.some((x: string) => m.includes(x.toLowerCase())) : null });
  }
  return checks;
}

const ScholarshipDetailPage = () => {
  const { scholarshipId } = useParams<{ scholarshipId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [routeGpa, setRouteGpa] = useState<number | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [essays, setEssays] = useState<Essay[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user || !scholarshipId) return;
    setLoading(true);
    const [{ data: s }, { data: p }, { data: r }, { data: a }] = await Promise.all([
      supabase.from('scholarships').select('*').eq('id', scholarshipId).single(),
      supabase.from('scholarship_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('routes').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('scholarship_applications').select('*').eq('user_id', user.id).eq('scholarship_id', scholarshipId).maybeSingle(),
    ]);
    setScholarship(s as Scholarship);
    setProfile(p);
    if (r?.id) {
      const { data: ri } = await supabase.from('route_inputs').select('gpa').eq('route_id', r.id).maybeSingle();
      setRouteGpa(ri?.gpa ?? null);
    }
    setApplication(a as Application | null);
    if (a?.id) {
      const { data: es } = await supabase.from('essays').select('*').eq('application_id', a.id).order('created_at', { ascending: true });
      setEssays((es as Essay[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, scholarshipId]);

  const userGpa = profile?.current_gpa ?? routeGpa;
  const eligibility = useMemo(
    () => scholarship ? evaluateEligibility(scholarship.eligibility_criteria, profile, userGpa) : [],
    [scholarship, profile, userGpa]
  );
  const failedHard = eligibility.some(c => c.ok === false);
  const days = daysUntil(scholarship?.deadline ?? null);

  const upsertApp = async (patch: Partial<Application>) => {
    if (!user || !scholarship) return null;
    setSaving(true);
    let row = application;
    if (!row) {
      const { data, error } = await supabase
        .from('scholarship_applications')
        .insert({ user_id: user.id, scholarship_id: scholarship.id, status: 'saved', ...patch })
        .select().single();
      if (error) { toast.error(error.message); setSaving(false); return null; }
      row = data as Application;
    } else {
      const { data, error } = await supabase
        .from('scholarship_applications')
        .update(patch).eq('id', row.id).select().single();
      if (error) { toast.error(error.message); setSaving(false); return null; }
      row = data as Application;
    }
    setApplication(row);
    setSaving(false);
    return row;
  };

  const handleSaveForLater = async () => {
    const r = await upsertApp({ status: 'saved' });
    if (r) toast.success('Saved to your applications');
  };

  const handleStart = async () => {
    const r = await upsertApp({ status: 'in_progress' });
    if (!r || !scholarship) return;
    // Pre-create essay drafts for each prompt
    const prompts = Array.isArray(scholarship.essay_prompts) ? scholarship.essay_prompts : [];
    if (prompts.length && essays.length === 0) {
      const rows = prompts.map((p: any, i: number) => ({
        user_id: user!.id,
        application_id: r.id,
        title: typeof p === 'object' ? (p.title || `Essay ${i + 1}`) : `Essay ${i + 1}`,
        prompt: typeof p === 'object' ? (p.prompt || p.question || '') : String(p),
        content: '',
      }));
      const { data } = await supabase.from('essays').insert(rows).select();
      if (data) setEssays(data as Essay[]);
    }
    toast.success('Application started');
  };

  const handleSubmit = async () => {
    const r = await upsertApp({ status: 'submitted', submitted_at: new Date().toISOString() } as any);
    if (r) toast.success('Marked as submitted!');
  };

  const handleMark = async (status: 'won' | 'lost', amount?: number) => {
    const patch: any = { status };
    if (status === 'won' && amount != null) patch.amount_won_cents = amount;
    const r = await upsertApp(patch);
    if (r) toast.success(status === 'won' ? 'Congratulations! 🎉' : 'Marked as not selected');
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading...</div>;
  }
  if (!scholarship) {
    return <div className="py-20 text-center"><p className="text-muted-foreground">Scholarship not found.</p><Button asChild className="mt-4"><Link to="/app/scholarships">Back to Scholarships</Link></Button></div>;
  }

  const view: 'A' | 'B' | 'C' = !application || application.status === 'saved' ? 'A'
    : application.status === 'in_progress' ? 'B' : 'C';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/scholarships')} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" />Back to Scholarships
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <CardTitle className="font-display text-2xl">{scholarship.name}</CardTitle>
              {scholarship.sponsor && <CardDescription className="mt-1">{scholarship.sponsor}</CardDescription>}
            </div>
            {application && (
              <Badge variant={view === 'C' && application.status === 'won' ? 'default' : 'secondary'} className="capitalize">
                {application.status.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-muted-foreground" />{fmtAmt(scholarship.amount_cents)}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-muted-foreground" />{fmtDate(scholarship.deadline)}{days != null && days >= 0 ? ` · ${days}d left` : ''}</span>
            {scholarship.external_url && (
              <a href={scholarship.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                Official site <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {scholarship.description && <p className="text-sm text-muted-foreground">{scholarship.description}</p>}
          <p className="text-xs text-muted-foreground italic">
            This information is gathered from public sources and may not be complete or current. Always verify details and submit applications on the sponsor's official site.
          </p>
        </CardContent>
      </Card>

      {view === 'A' && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-lg">Eligibility check</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {eligibility.length === 0 ? (
                <p className="text-sm text-muted-foreground">No specific eligibility criteria listed — this scholarship appears open.</p>
              ) : eligibility.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.ok === true ? <CheckCircle2 className="h-4 w-4 text-success" />
                    : c.ok === false ? <XCircle className="h-4 w-4 text-destructive" />
                    : <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
                  <span>{c.label}</span>
                  {c.ok === null && <span className="text-xs text-muted-foreground">(unknown — complete your profile)</span>}
                </div>
              ))}
              {failedHard && (
                <p className="text-xs text-destructive mt-2">You may not meet all stated requirements. You can still apply, but review the official criteria first.</p>
              )}
            </CardContent>
          </Card>

          {Array.isArray(scholarship.essay_prompts) && scholarship.essay_prompts.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Essay prompts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {scholarship.essay_prompts.map((p: any, i: number) => (
                  <div key={i} className="text-sm border-l-2 border-primary/30 pl-3">
                    <div className="font-medium">{typeof p === 'object' ? (p.title || `Prompt ${i + 1}`) : `Prompt ${i + 1}`}</div>
                    <div className="text-muted-foreground">{typeof p === 'object' ? (p.prompt || p.question || '') : String(p)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleStart} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Start application
            </Button>
            {!application && (
              <Button variant="outline" onClick={handleSaveForLater} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />Save for later
              </Button>
            )}
            {scholarship.external_url && (
              <Button variant="ghost" asChild>
                <a href={scholarship.external_url} target="_blank" rel="noopener noreferrer">
                  Official site <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </>
      )}

      {view === 'B' && application && (
        <ApplicationWorkspace
          scholarship={scholarship}
          application={application}
          essays={essays}
          setEssays={setEssays}
          onSubmit={handleSubmit}
          onUpdateNotes={(notes) => upsertApp({ notes })}
          saving={saving}
        />
      )}

      {view === 'C' && application && (
        <SubmittedView application={application} scholarship={scholarship} onMark={handleMark} />
      )}
    </div>
  );
};

// ====================== VIEW B ======================
const ApplicationWorkspace = ({ scholarship, application, essays, setEssays, onSubmit, onUpdateNotes, saving }: {
  scholarship: Scholarship;
  application: Application;
  essays: Essay[];
  setEssays: (e: Essay[]) => void;
  onSubmit: () => void;
  onUpdateNotes: (notes: string) => Promise<any>;
  saving: boolean;
}) => {
  const [notes, setNotes] = useState(application.notes || '');
  const [drafting, setDrafting] = useState<string | null>(null);

  const updateEssay = (id: string, patch: Partial<Essay>) => {
    setEssays(essays.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const saveEssay = async (e: Essay) => {
    const wc = (e.content || '').trim().split(/\s+/).filter(Boolean).length;
    const { error } = await supabase.from('essays').update({
      title: e.title, content: e.content, word_count: wc, tone: e.tone,
    }).eq('id', e.id);
    if (error) toast.error(error.message);
    else { updateEssay(e.id, { word_count: wc }); toast.success('Essay saved'); }
  };

  const aiDraft = async (e: Essay) => {
    if (!e.prompt) { toast.error('No prompt to draft from'); return; }
    setDrafting(e.id);
    const { data, error } = await supabase.functions.invoke('draft-scholarship-essay', {
      body: {
        prompt: e.prompt,
        scholarship_name: scholarship.name,
        sponsor: scholarship.sponsor,
        target_word_count: 500,
        tone: e.tone || 'authentic and reflective',
      },
    });
    setDrafting(null);
    if (error) { toast.error(error.message); return; }
    if (data?.draft) {
      updateEssay(e.id, { content: data.draft });
      toast.success('Draft generated — review and edit');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application workspace</CardTitle>
          <CardDescription>Draft your essays here. AI suggestions use your scholarship profile — always review and edit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {essays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No essay prompts on file. Use the notes section below to track your progress.</p>
          ) : essays.map((e) => {
            const wc = (e.content || '').trim().split(/\s+/).filter(Boolean).length;
            return (
              <div key={e.id} className="space-y-2 p-4 rounded-lg border bg-card">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <Input
                    className="font-display text-base font-semibold max-w-md border-0 px-0 focus-visible:ring-0"
                    value={e.title || ''}
                    onChange={(ev) => updateEssay(e.id, { title: ev.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <Select value={e.tone || 'reflective'} onValueChange={(v) => updateEssay(e.id, { tone: v })}>
                      <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reflective">Reflective</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => aiDraft(e)} disabled={drafting === e.id}>
                      {drafting === e.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      AI draft
                    </Button>
                  </div>
                </div>
                {e.prompt && <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2 italic">{e.prompt}</p>}
                <Textarea
                  rows={10}
                  placeholder="Write your essay here..."
                  value={e.content || ''}
                  onChange={(ev) => updateEssay(e.id, { content: ev.target.value })}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{wc} words</span>
                  <Button size="sm" variant="secondary" onClick={() => saveEssay(e)}>
                    <Save className="h-3 w-3 mr-1" />Save
                  </Button>
                </div>
              </div>
            );
          })}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="app-notes">Application notes</Label>
            <Textarea
              id="app-notes"
              rows={4}
              placeholder="Letters of recommendation requested, transcripts ordered, follow-ups..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onUpdateNotes(notes)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/40">
        <CardContent className="py-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="text-sm">
            <p className="font-medium">Ready to submit?</p>
            <p className="text-muted-foreground">Submit on the official sponsor site, then mark complete here.</p>
          </div>
          <div className="flex gap-2">
            {scholarship.external_url && (
              <Button variant="outline" asChild>
                <a href={scholarship.external_url} target="_blank" rel="noopener noreferrer">Open official site <ExternalLink className="h-3 w-3 ml-1" /></a>
              </Button>
            )}
            <Button onClick={onSubmit} disabled={saving}>
              <CheckCircle2 className="h-4 w-4 mr-2" />Mark as submitted
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// ====================== VIEW C ======================
const SubmittedView = ({ application, scholarship, onMark }: {
  application: Application;
  scholarship: Scholarship;
  onMark: (status: 'won' | 'lost', amount?: number) => void;
}) => {
  const [amount, setAmount] = useState('');

  if (application.status === 'won') {
    return (
      <Card className="border-success bg-success/5">
        <CardContent className="py-8 text-center space-y-3">
          <PartyPopper className="h-10 w-10 text-success mx-auto" />
          <h2 className="text-2xl font-display font-bold">Congratulations!</h2>
          <p className="text-muted-foreground">You won {fmtAmt(application.amount_won_cents || scholarship.amount_cents)} from {scholarship.sponsor || scholarship.name}.</p>
          <Button asChild variant="outline"><Link to="/app/scholarships">Find more scholarships</Link></Button>
        </CardContent>
      </Card>
    );
  }
  if (application.status === 'lost') {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <p className="text-muted-foreground">Marked as not selected. Don't give up — keep applying.</p>
          <Button asChild><Link to="/app/scholarships">Find more scholarships</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Submitted</CardTitle>
        <CardDescription>
          Submitted {application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'recently'}. Update the result when you hear back.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="amt">Amount won (USD, optional)</Label>
            <Input id="amt" type="number" placeholder="e.g. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button onClick={() => onMark('won', amount ? Number(amount) * 100 : undefined)}>
            <Trophy className="h-4 w-4 mr-2" />I won this
          </Button>
          <Button variant="outline" onClick={() => onMark('lost')}>Not selected</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScholarshipDetailPage;
