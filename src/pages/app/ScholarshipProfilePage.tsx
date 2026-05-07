import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, Check, Lock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const steps = [
  { title: 'Basics', desc: 'Where do you live?' },
  { title: 'Demographics', desc: 'Help us match you to scholarships you qualify for.' },
  { title: 'Financial', desc: 'Optional — improves need-based matches.' },
  { title: 'Academics', desc: 'Your GPA, major, and goals.' },
  { title: 'Activities', desc: 'Service, leadership, and interests.' },
  { title: 'Work Experience', desc: 'Jobs you have held.' },
  { title: 'Personal', desc: 'Your story (all optional).' },
  { title: 'Review & Save', desc: 'Confirm your profile.' },
];

const ETHNICITIES = [
  'African American/Black',
  'Asian',
  'Hispanic/Latino',
  'Native American/Alaska Native',
  'Native Hawaiian/Pacific Islander',
  'Middle Eastern/North African',
  'White',
  'Two or more races',
  'Other',
];

interface WorkEntry {
  role: string;
  hours_per_week: string;
  months: string;
}

const ScholarshipProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    state_of_residence: 'CA',
    city: '',
    zip_code: '',
    citizenship_status: '',
    ethnicities: [] as string[],
    gender: '',
    lgbtq: false,
    first_generation_college: false,
    veteran_or_military_family: false,
    disability_status: false,
    religion: '',
    pell_grant_eligible: false,
    household_income_range: '',
    expected_family_contribution: '',
    single_parent_household: false,
    current_gpa: '',
    intended_major: '',
    career_goal: '',
    community_service_hours: '',
    leadership_roles: '',
    sports: '',
    arts_activities: '',
    clubs_organizations: '',
    challenges_overcome: '',
    unique_attributes: '',
    career_motivation: '',
  });
  const [workExperience, setWorkExperience] = useState<WorkEntry[]>([]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('scholarship_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setForm({
          state_of_residence: profile.state_of_residence ?? 'CA',
          city: profile.city ?? '',
          zip_code: profile.zip_code ?? '',
          citizenship_status: profile.citizenship_status ?? '',
          ethnicities: profile.ethnicities ?? [],
          gender: profile.gender ?? '',
          lgbtq: !!profile.lgbtq,
          first_generation_college: !!profile.first_generation_college,
          veteran_or_military_family: !!profile.veteran_or_military_family,
          disability_status: !!profile.disability_status,
          religion: profile.religion ?? '',
          pell_grant_eligible: !!profile.pell_grant_eligible,
          household_income_range: profile.household_income_range ?? '',
          expected_family_contribution: profile.expected_family_contribution_cents != null ? String(profile.expected_family_contribution_cents / 100) : '',
          single_parent_household: !!profile.single_parent_household,
          current_gpa: profile.current_gpa?.toString() ?? '',
          intended_major: profile.intended_major ?? '',
          career_goal: profile.career_goal ?? '',
          community_service_hours: profile.community_service_hours?.toString() ?? '',
          leadership_roles: (profile.leadership_roles ?? []).join(', '),
          sports: (profile.sports ?? []).join(', '),
          arts_activities: (profile.arts_activities ?? []).join(', '),
          clubs_organizations: (profile.clubs_organizations ?? []).join(', '),
          challenges_overcome: profile.challenges_overcome ?? '',
          unique_attributes: profile.unique_attributes ?? '',
          career_motivation: profile.career_motivation ?? '',
        });
        const we = (profile.work_experience as any[]) || [];
        setWorkExperience(we.map(w => ({
          role: w?.role ?? '',
          hours_per_week: w?.hours_per_week?.toString() ?? '',
          months: w?.months?.toString() ?? '',
        })));
      } else {
        // Pre-populate from most recent route_inputs
        const { data: route } = await supabase
          .from('routes')
          .select('id, major')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (route) {
          const { data: ri } = await supabase
            .from('route_inputs')
            .select('gpa')
            .eq('route_id', route.id)
            .maybeSingle();
          setForm(f => ({
            ...f,
            intended_major: route.major ?? '',
            current_gpa: ri?.gpa?.toString() ?? '',
          }));
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const toCsvArray = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

  const calcCompleteness = () => {
    let pct = 0;
    if (form.state_of_residence && form.citizenship_status) pct += 25;
    if (form.ethnicities.length > 0 || form.gender) pct += 25;
    if (form.current_gpa || form.intended_major) pct += 20;
    if (form.community_service_hours || form.leadership_roles || form.clubs_organizations) pct += 20;
    if (form.challenges_overcome || form.unique_attributes || form.career_motivation) pct += 10;
    return Math.min(pct, 100);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        state_of_residence: form.state_of_residence || null,
        city: form.city || null,
        zip_code: form.zip_code || null,
        citizenship_status: form.citizenship_status || null,
        ethnicities: form.ethnicities.length > 0 ? form.ethnicities : null,
        gender: form.gender || null,
        lgbtq: form.lgbtq,
        first_generation_college: form.first_generation_college,
        veteran_or_military_family: form.veteran_or_military_family,
        disability_status: form.disability_status,
        religion: form.religion || null,
        pell_grant_eligible: form.pell_grant_eligible,
        household_income_range: form.household_income_range || null,
        expected_family_contribution_cents: form.expected_family_contribution ? Math.round(parseFloat(form.expected_family_contribution) * 100) : null,
        single_parent_household: form.single_parent_household,
        current_gpa: form.current_gpa ? parseFloat(form.current_gpa) : null,
        intended_major: form.intended_major || null,
        career_goal: form.career_goal || null,
        community_service_hours: form.community_service_hours ? parseInt(form.community_service_hours) : null,
        leadership_roles: toCsvArray(form.leadership_roles),
        sports: toCsvArray(form.sports),
        arts_activities: toCsvArray(form.arts_activities),
        clubs_organizations: toCsvArray(form.clubs_organizations),
        work_experience: workExperience.map(w => ({
          role: w.role,
          hours_per_week: w.hours_per_week ? parseInt(w.hours_per_week) : null,
          months: w.months ? parseInt(w.months) : null,
        })),
        challenges_overcome: form.challenges_overcome || null,
        unique_attributes: form.unique_attributes || null,
        career_motivation: form.career_motivation || null,
        profile_completeness: calcCompleteness(),
      };

      const { error } = await supabase
        .from('scholarship_profiles')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Profile saved! Finding your matches...');
      navigate('/app/scholarships');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleEthnicity = (e: string) => {
    setForm(f => ({
      ...f,
      ethnicities: f.ethnicities.includes(e)
        ? f.ethnicities.filter(x => x !== e)
        : [...f.ethnicities, e],
    }));
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {steps.map((_, i) => (
          <div key={i} className="flex items-center gap-2 flex-1 min-w-[24px]">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
              i < step ? 'bg-success text-success-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? 'bg-success' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div><Label>State of Residence</Label><Input value={form.state_of_residence} onChange={e => set('state_of_residence', e.target.value)} /></div>
              <div><Label>City</Label><Input value={form.city} onChange={e => set('city', e.target.value)} /></div>
              <div><Label>ZIP Code</Label><Input value={form.zip_code} onChange={e => set('zip_code', e.target.value)} /></div>
              <div>
                <Label>Citizenship Status</Label>
                <Select value={form.citizenship_status} onValueChange={v => set('citizenship_status', v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us_citizen">US Citizen</SelectItem>
                    <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                    <SelectItem value="daca">DACA</SelectItem>
                    <SelectItem value="undocumented">Undocumented</SelectItem>
                    <SelectItem value="international">International Student</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <Card className="bg-muted/40 border-muted">
                <CardContent className="py-3 flex gap-2 items-start text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>This information is private to you and used only to match you with scholarships. It is never shown to other users or sold.</span>
                </CardContent>
              </Card>

              <div>
                <Label>Ethnicities (select all that apply)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {ETHNICITIES.map(e => (
                    <label key={e} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.ethnicities.includes(e)} onCheckedChange={() => toggleEthnicity(e)} />
                      {e}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Gender</Label>
                <RadioGroup value={form.gender} onValueChange={v => set('gender', v)} className="mt-2">
                  {['Female', 'Male', 'Non-binary', 'Prefer not to say'].map(g => (
                    <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                      <RadioGroupItem value={g} /> {g}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between"><Label>LGBTQ+</Label><Switch checked={form.lgbtq} onCheckedChange={v => set('lgbtq', v)} /></div>
              <div className="flex items-center justify-between"><Label>First-generation college student</Label><Switch checked={form.first_generation_college} onCheckedChange={v => set('first_generation_college', v)} /></div>
              <div className="flex items-center justify-between"><Label>Veteran or military family</Label><Switch checked={form.veteran_or_military_family} onCheckedChange={v => set('veteran_or_military_family', v)} /></div>
              <div className="flex items-center justify-between"><Label>Disability status</Label><Switch checked={form.disability_status} onCheckedChange={v => set('disability_status', v)} /></div>
              <div><Label>Religion (optional)</Label><Input value={form.religion} onChange={e => set('religion', e.target.value)} /></div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center justify-between"><Label>Pell Grant eligible</Label><Switch checked={form.pell_grant_eligible} onCheckedChange={v => set('pell_grant_eligible', v)} /></div>
              <div>
                <Label>Household Income Range</Label>
                <Select value={form.household_income_range} onValueChange={v => set('household_income_range', v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_30k">Under $30k</SelectItem>
                    <SelectItem value="30k_60k">$30k–$60k</SelectItem>
                    <SelectItem value="60k_100k">$60k–$100k</SelectItem>
                    <SelectItem value="100k_plus">$100k+</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between"><Label>Single-parent household</Label><Switch checked={form.single_parent_household} onCheckedChange={v => set('single_parent_household', v)} /></div>
              <div>
                <Label>Expected Family Contribution (EFC)</Label>
                <Input type="number" min="0" placeholder="e.g., 5000" value={form.expected_family_contribution} onChange={e => set('expected_family_contribution', e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">From your FAFSA Student Aid Index. Leave blank if you don't know — we'll estimate from your income range.</p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div><Label>Current GPA</Label><Input type="number" step="0.01" min="0" max="4" value={form.current_gpa} onChange={e => set('current_gpa', e.target.value)} /></div>
              <div><Label>Intended Major</Label><Input value={form.intended_major} onChange={e => set('intended_major', e.target.value)} /></div>
              <div><Label>Career Goal</Label><Input value={form.career_goal} onChange={e => set('career_goal', e.target.value)} placeholder="e.g., Software engineer" /></div>
            </>
          )}

          {step === 4 && (
            <>
              <div><Label>Community Service Hours</Label><Input type="number" min="0" value={form.community_service_hours} onChange={e => set('community_service_hours', e.target.value)} /></div>
              <div><Label>Leadership Roles (comma-separated)</Label><Input value={form.leadership_roles} onChange={e => set('leadership_roles', e.target.value)} placeholder="e.g., ASB President, Club VP" /></div>
              <div><Label>Sports</Label><Input value={form.sports} onChange={e => set('sports', e.target.value)} placeholder="e.g., Soccer, Track" /></div>
              <div><Label>Arts Activities</Label><Input value={form.arts_activities} onChange={e => set('arts_activities', e.target.value)} placeholder="e.g., Theater, Photography" /></div>
              <div><Label>Clubs / Organizations</Label><Input value={form.clubs_organizations} onChange={e => set('clubs_organizations', e.target.value)} placeholder="e.g., Honor Society, Robotics" /></div>
            </>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {workExperience.map((w, i) => (
                <Card key={i} className="bg-muted/30">
                  <CardContent className="py-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Job #{i + 1}</span>
                      <Button variant="ghost" size="icon" onClick={() => setWorkExperience(we => we.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input placeholder="Role" value={w.role} onChange={e => setWorkExperience(we => we.map((x, idx) => idx === i ? { ...x, role: e.target.value } : x))} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="number" placeholder="Hours/week" value={w.hours_per_week} onChange={e => setWorkExperience(we => we.map((x, idx) => idx === i ? { ...x, hours_per_week: e.target.value } : x))} />
                      <Input type="number" placeholder="Months" value={w.months} onChange={e => setWorkExperience(we => we.map((x, idx) => idx === i ? { ...x, months: e.target.value } : x))} />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={() => setWorkExperience(we => [...we, { role: '', hours_per_week: '', months: '' }])}>
                <Plus className="h-4 w-4 mr-2" />Add Job
              </Button>
            </div>
          )}

          {step === 6 && (
            <>
              <div><Label>Challenges You've Overcome</Label><Textarea rows={4} value={form.challenges_overcome} onChange={e => set('challenges_overcome', e.target.value)} /></div>
              <div><Label>Unique Attributes</Label><Textarea rows={4} value={form.unique_attributes} onChange={e => set('unique_attributes', e.target.value)} /></div>
              <div><Label>Career Motivation</Label><Textarea rows={4} value={form.career_motivation} onChange={e => set('career_motivation', e.target.value)} /></div>
            </>
          )}

          {step === 7 && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Location:</span> {form.city || '—'}, {form.state_of_residence}</div>
              <div><span className="font-medium">Citizenship:</span> {form.citizenship_status || '—'}</div>
              <div><span className="font-medium">Ethnicities:</span> {form.ethnicities.join(', ') || '—'}</div>
              <div><span className="font-medium">Gender:</span> {form.gender || '—'}</div>
              <div><span className="font-medium">First-gen:</span> {form.first_generation_college ? 'Yes' : 'No'}</div>
              <div><span className="font-medium">Pell:</span> {form.pell_grant_eligible ? 'Yes' : 'No'}</div>
              <div><span className="font-medium">GPA:</span> {form.current_gpa || '—'}</div>
              <div><span className="font-medium">Major:</span> {form.intended_major || '—'}</div>
              <div><span className="font-medium">Career goal:</span> {form.career_goal || '—'}</div>
              <div><span className="font-medium">Service hours:</span> {form.community_service_hours || '0'}</div>
              <div><span className="font-medium">Work entries:</span> {workExperience.length}</div>
              <div className="pt-3 text-muted-foreground">Estimated profile completeness: <strong>{calcCompleteness()}%</strong></div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />Previous
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)}>Next<ArrowRight className="h-4 w-4 ml-2" /></Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}<Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScholarshipProfilePage;
