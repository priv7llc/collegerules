import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

const steps = [
  { title: 'Your College', desc: 'Which community college are you attending?' },
  { title: 'Your Major', desc: 'What major are you pursuing?' },
  { title: 'Destination', desc: 'Where do you want to transfer?' },
  { title: 'Preferences', desc: 'Tell us about your preferences.' },
  { title: 'Academic History', desc: 'What have you completed so far?' },
  { title: 'Review & Submit', desc: 'Review your route details.' },
];

const CreateRoutePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    communityCollege: '',
    state: 'California',
    major: '',
    majorTrack: '',
    destinationUniversity: '',
    destinationProgram: '',
    transferTerm: '',
    schedule: 'full-time',
    format: 'in-person',
    completedCourses: '',
    inProgressCourses: '',
    apCredits: '',
    gpa: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const canNext = () => {
    if (step === 0) return form.communityCollege.trim().length > 0;
    if (step === 1) return form.major.trim().length > 0;
    if (step === 2) return true; // destination has defaults
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Check credits
      const { data: credits } = await supabase.rpc('get_remaining_credits', { _user_id: user.id });
      if (!credits || (credits as number) <= 0) {
        toast.error('No route credits remaining. Please purchase more.');
        navigate('/pricing');
        return;
      }

      // Create route
      const routeName = `${form.communityCollege} → ${form.major} (${form.majorTrack || 'AS-T'})`;
      const { data: route, error: routeError } = await supabase.from('routes').insert({
        user_id: user.id,
        route_name: routeName,
        community_college: form.communityCollege,
        major: form.major,
        destination_university: 'CSU System',
        destination_program: form.majorTrack || `${form.major} AS-T`,
        transfer_term: form.transferTerm || null,
        status: 'processing' as const,
      }).select().single();

      if (routeError) throw routeError;

      // Save inputs
      const completedArr = form.completedCourses.split(',').map(s => s.trim()).filter(Boolean);
      const inProgressArr = form.inProgressCourses.split(',').map(s => s.trim()).filter(Boolean);
      const apArr = form.apCredits.split(',').map(s => s.trim()).filter(Boolean);

      await supabase.from('route_inputs').insert({
        route_id: route.id,
        completed_courses: completedArr as unknown as Json,
        in_progress_courses: inProgressArr as unknown as Json,
        ap_ib_credits: apArr as unknown as Json,
        student_preferences: { schedule: form.schedule, format: form.format } as unknown as Json,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        raw_form_payload: form as unknown as Json,
      });

      // Generate dashboard via AI edge function
      toast.info('Generating your personalized route... This may take 30-60 seconds.');

      const { data: dashData, error: dashError } = await supabase.functions.invoke('generate-route-dashboard', {
        body: {
          communityCollege: form.communityCollege,
          major: form.major,
          degreeType: form.majorTrack || 'AS-T',
          state: form.state,
        },
      });

      if (dashError || !dashData?.success) {
        console.error('Dashboard generation error:', dashError, dashData);
        throw new Error(dashData?.error || dashError?.message || 'Failed to generate dashboard');
      }

      await supabase.from('route_dashboards').insert({
        route_id: route.id,
        dashboard_payload: dashData.dashboard as unknown as Json,
        version: 1,
        generated_by: 'ai',
        llm_model: 'gemini-2.5-flash',
      });

      // Use a credit
      const { data: creditRecords } = await supabase
        .from('route_credits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (creditRecords) {
        for (const cr of creditRecords) {
          const available = cr.credits_added - cr.credits_used;
          if (available > 0) {
            await supabase.from('route_credits').update({ credits_used: cr.credits_used + 1 }).eq('id', cr.id);
            break;
          }
        }
      }

      // Mark ready
      await supabase.from('routes').update({ status: 'ready' as const }).eq('id', route.id);

      toast.success('Route created! Your dashboard is ready.');
      navigate(`/app/route/${route.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create route');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
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
              <div><Label>Community College</Label><Input value={form.communityCollege} onChange={e => set('communityCollege', e.target.value)} placeholder="e.g., Foothill College" /></div>
              <div><Label>State</Label><Input value={form.state} onChange={e => set('state', e.target.value)} /></div>
            </>
          )}
          {step === 1 && (
            <>
              <div><Label>Major</Label><Input value={form.major} onChange={e => set('major', e.target.value)} placeholder="e.g., Business Administration" /></div>
              <div>
                <Label>Degree Type</Label>
                <Select value={form.majorTrack || 'AS-T'} onValueChange={v => set('majorTrack', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AS-T">AS-T (Associate in Science for Transfer)</SelectItem>
                    <SelectItem value="AA-T">AA-T (Associate in Arts for Transfer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div><Label>Target Transfer System</Label>
                <Select value={form.destinationUniversity || 'CSU'} onValueChange={v => set('destinationUniversity', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSU">CSU (California State University)</SelectItem>
                    <SelectItem value="UC">UC (University of California)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Target Campus (optional)</Label><Input value={form.destinationProgram} onChange={e => set('destinationProgram', e.target.value)} placeholder="e.g., San José State University" /></div>
            </>
          )}
          {step === 3 && (
            <>
              <div><Label>Desired Transfer Term</Label><Input value={form.transferTerm} onChange={e => set('transferTerm', e.target.value)} placeholder="e.g., Fall 2026" /></div>
              <div>
                <Label>Schedule</Label>
                <Select value={form.schedule} onValueChange={v => set('schedule', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select value={form.format} onValueChange={v => set('format', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">In-person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div><Label>Completed Courses (comma-separated)</Label><Textarea value={form.completedCourses} onChange={e => set('completedCourses', e.target.value)} placeholder="e.g., ENGL 1A, MATH 48C" /></div>
              <div><Label>In-Progress Courses (comma-separated)</Label><Textarea value={form.inProgressCourses} onChange={e => set('inProgressCourses', e.target.value)} placeholder="e.g., CS 1A, MATH 1A" /></div>
              <div><Label>AP/IB/Dual Enrollment Credit (comma-separated)</Label><Textarea value={form.apCredits} onChange={e => set('apCredits', e.target.value)} placeholder="e.g., AP Calculus AB, AP English Lang" /></div>
              <div><Label>GPA (optional)</Label><Input value={form.gpa} onChange={e => set('gpa', e.target.value)} placeholder="e.g., 3.5" type="number" step="0.01" min="0" max="4" /></div>
            </>
          )}
          {step === 5 && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-medium">College:</span> {form.communityCollege}</div>
                <div><span className="font-medium">State:</span> {form.state}</div>
                <div><span className="font-medium">Major:</span> {form.major}</div>
                <div><span className="font-medium">Track:</span> {form.majorTrack || 'None'}</div>
                <div><span className="font-medium">University:</span> {form.destinationUniversity}</div>
                <div><span className="font-medium">Program:</span> {form.destinationProgram || 'General'}</div>
                <div><span className="font-medium">Transfer Term:</span> {form.transferTerm || 'Not specified'}</div>
                <div><span className="font-medium">Schedule:</span> {form.schedule}</div>
                <div><span className="font-medium">Format:</span> {form.format}</div>
                <div><span className="font-medium">GPA:</span> {form.gpa || 'Not provided'}</div>
              </div>
              {form.completedCourses && <div><span className="font-medium">Completed:</span> {form.completedCourses}</div>}
              {form.inProgressCourses && <div><span className="font-medium">In Progress:</span> {form.inProgressCourses}</div>}
              {form.apCredits && <div><span className="font-medium">AP/IB:</span> {form.apCredits}</div>}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />Previous
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Next<ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Route'}<Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateRoutePage;
