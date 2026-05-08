import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft, BookOpen, CheckCircle2, AlertTriangle, Info, ExternalLink,
  GraduationCap, Calendar, Target, Shield, Clock, Monitor, Home,
  List, BookMarked, Route, Landmark, Link2, Wallet, Trophy, ClipboardList, UserCog, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { AffordabilityTab } from '@/components/AffordabilityTab';
import type { DashboardPayload } from '@/lib/dashboardTypes';

const iconMap: Record<string, any> = {
  shield: Shield, clock: Clock, monitor: Monitor, book: BookOpen,
  map: Route, calendar: Calendar, alert: AlertTriangle, target: Target,
};

const RouteDashboardPage = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const { user } = useAuth();
  const [route, setRoute] = useState<any>(null);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [courseStatus, setCourseStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!routeId || !user) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      const [{ data: r }, { data: d }, { data: cl }, { data: cp }] = await Promise.all([
        supabase.from('routes').select('*').eq('id', routeId).single(),
        supabase.from('route_dashboards').select('*').eq('route_id', routeId).order('version', { ascending: false }).limit(1).single(),
        supabase.from('checklist_progress').select('*').eq('route_id', routeId),
        supabase.from('course_progress').select('*').eq('route_id', routeId),
      ]);
      if (cancelled) return;
      setRoute(r);
      if (d) setDashboard(d.dashboard_payload as unknown as DashboardPayload);
      const clMap: Record<string, boolean> = {};
      cl?.forEach((c: any) => { clMap[c.item_key] = c.completed; });
      setChecklist(clMap);
      const cpMap: Record<string, string> = {};
      cp?.forEach((c: any) => { cpMap[c.course_key] = c.status; });
      setCourseStatus(cpMap);
      setLoading(false);

      // If still processing, poll every 5 seconds
      if (r && r.status === 'processing' && !d) {
        pollTimer = setTimeout(() => { if (!cancelled) load(); }, 5000);
      }
    };
    load();

    return () => { cancelled = true; if (pollTimer) clearTimeout(pollTimer); };
  }, [routeId, user]);

  const toggleChecklist = useCallback(async (key: string) => {
    if (!routeId) return;
    const newVal = !checklist[key];
    setChecklist(prev => ({ ...prev, [key]: newVal }));
    await supabase.from('checklist_progress').upsert({
      route_id: routeId, item_key: key, completed: newVal, completed_at: newVal ? new Date().toISOString() : null,
    }, { onConflict: 'route_id,item_key' });
  }, [routeId, checklist]);

  const setCourseState = useCallback(async (key: string, status: string) => {
    if (!routeId) return;
    setCourseStatus(prev => ({ ...prev, [key]: status }));
    await supabase.from('course_progress').upsert({
      route_id: routeId, course_key: key, status,
    }, { onConflict: 'route_id,course_key' });
  }, [routeId]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  if (route && route.status === 'processing' && !dashboard) return (
    <div className="text-center py-12 space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
      <h2 className="text-lg font-semibold">Generating Your Route...</h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        Our AI is building your personalized transfer dashboard. This usually takes 30–60 seconds.
      </p>
    </div>
  );

  if (!route || !dashboard) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{route?.status === 'needs_review' ? 'Route generation encountered an issue. Please contact support or try again.' : 'Route not found.'}</p>
      <Button asChild className="mt-4"><Link to="/app">Back to Routes</Link></Button>
    </div>
  );

  const meta = dashboard.routeMeta;
  const majorTotal = dashboard.majorCourses?.length || 0;
  const majorDone = dashboard.majorCourses?.filter(c => courseStatus[c.key] === 'completed').length || 0;
  const geTotal = dashboard.calGetcAreas?.length || 0;
  const geDone = dashboard.calGetcAreas?.filter(a => checklist[a.key]).length || 0;
  const checklistTotal = dashboard.quickStartChecklist?.length || 0;
  const checklistDone = dashboard.quickStartChecklist?.filter(c => checklist[c.key]).length || 0;
  const totalItems = majorTotal + geTotal + checklistTotal;
  const readyPct = totalItems > 0 ? Math.round(((majorDone + geDone + checklistDone) / totalItems) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" asChild><Link to="/app"><ArrowLeft className="h-4 w-4 mr-1" />My Routes</Link></Button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary-foreground/20 rounded-full h-10 w-10 flex items-center justify-center font-bold text-sm">
            {meta.communityCollege?.substring(0, 2).toUpperCase() || 'CC'}
          </div>
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold">{meta.communityCollege}</h1>
            <p className="text-primary-foreground/80 text-sm">
              {meta.degreeName || `${meta.major} ${meta.degreeType || 'AS-T'}`}
              <Badge className="ml-2 bg-primary-foreground/20 text-primary-foreground border-0 text-xs">{meta.degreeType || 'AS-T'}</Badge>
            </p>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'MAJOR COURSES', value: majorDone, total: majorTotal, icon: BookOpen, color: 'from-blue-500 to-blue-600' },
          { label: 'CAL-GETC AREAS', value: geDone, total: geTotal, icon: BookMarked, color: 'from-emerald-500 to-emerald-600' },
          { label: 'ACTION ITEMS', value: checklistDone, total: checklistTotal, icon: CheckCircle2, color: 'from-violet-500 to-violet-600' },
          { label: 'DEGREE READY', value: readyPct, total: 100, pct: true, icon: Target, color: 'from-orange-500 to-orange-600' },
        ].map(m => (
          <div key={m.label} className={`bg-gradient-to-br ${m.color} rounded-xl p-4 text-white`}>
            <m.icon className="h-5 w-5 mb-2 opacity-80" />
            <p className="text-xs font-medium opacity-80 tracking-wide">{m.label}</p>
            <p className="text-2xl font-bold mt-1">{(m as any).pct ? `${m.value}%` : `${m.value} / ${m.total}`}</p>
            <Progress value={m.total > 0 ? (m.value / m.total) * 100 : 0} className="mt-2 h-1.5 bg-white/20" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0 border-b rounded-none pb-0">
          {[
            { value: 'overview', label: 'Overview', icon: Home },
            { value: 'affordability', label: 'Affordability', icon: Wallet },
            { value: 'major-courses', label: 'Major Courses', icon: List },
            { value: 'cal-getc', label: 'Cal-GETC / GE', icon: BookMarked },
            { value: 'course-sequence', label: 'Course Sequence', icon: Calendar },
            { value: 'transfer-guide', label: 'Transfer Guide', icon: Route },
            { value: 'resources', label: 'Resources', icon: Link2 },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none gap-1.5">
              <tab.icon className="h-4 w-4" />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <p className="text-muted-foreground text-sm">
            Your complete roadmap to the {meta.communityCollege} {meta.degreeName || meta.major} — guaranteed CSU admission pathway
          </p>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.overviewCards?.map((card, i) => {
              const Icon = iconMap[card.icon] || Target;
              return (
                <Card key={i}>
                  <CardContent className="pt-5 flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5"><Icon className="h-5 w-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold text-sm">{card.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.boldText ? (
                          <>{card.description.split(card.boldText)[0]}<strong>{card.boldText}</strong>{card.description.split(card.boldText).slice(1).join(card.boldText)}</>
                        ) : card.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Key Requirements + Critical Notes */}
          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.keyRequirements && dashboard.keyRequirements.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">⭐ Key Requirements</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {dashboard.keyRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{req.boldPart ? <>{req.text.split(req.boldPart)[0]}<strong>{req.boldPart}</strong>{req.text.split(req.boldPart).slice(1).join(req.boldPart)}</> : req.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {dashboard.criticalNotes && dashboard.criticalNotes.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">⚠️ Critical Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.criticalNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                      <span>{note.boldPart ? <><strong>{note.boldPart}</strong> — {note.text.replace(note.boldPart, '').replace(/^\s*—?\s*/, '')}</> : note.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick-Start Checklist */}
          {dashboard.quickStartChecklist && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick-Start Action Items</CardTitle>
                <p className="text-xs text-muted-foreground">Check these off as you complete them — progress is saved automatically</p>
              </CardHeader>
              <CardContent className="space-y-1">
                {dashboard.quickStartChecklist.map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/50 cursor-pointer">
                    <Checkbox checked={!!checklist[item.key]} onCheckedChange={() => toggleChecklist(item.key)} />
                    <span className={`text-sm flex-1 ${checklist[item.key] ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
                    <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'secondary' : 'outline'} className="text-xs">{item.priority}</Badge>
                  </label>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== AFFORDABILITY TAB ===== */}
        <TabsContent value="affordability" className="space-y-6 mt-6">
          <AffordabilityTab routeId={routeId!} destinationUniversity={route?.destination_university || ''} />
        </TabsContent>

        {/* ===== MAJOR COURSES TAB ===== */}
        <TabsContent value="major-courses" className="space-y-4 mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Major Courses — {meta.majorUnits || '?'} Units</h2>
            <p className="text-sm text-muted-foreground">All required course areas. Every course must be completed with a grade of C or better.</p>
            <div className="mt-2 bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">Major Unit Progress</p>
              <p className="text-xs text-muted-foreground">{majorDone} / {majorTotal} courses completed</p>
              <Progress value={majorTotal > 0 ? (majorDone / majorTotal) * 100 : 0} className="mt-2 h-2" />
            </div>
          </div>

          {dashboard.majorCourses?.map(course => {
            const status = courseStatus[course.key] || 'not_started';
            return (
              <Card key={course.key} className={status === 'completed' ? 'border-green-200 bg-green-50/30' : ''}>
                <CardContent className="pt-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base">{course.code}</h3>
                        <Badge variant="outline" className="text-xs">{course.units} units</Badge>
                        {course.honorsAvailable && <Badge variant="secondary" className="text-xs">Honors Available</Badge>}
                      </div>
                      <p className="font-medium text-sm mb-1">{course.name}</p>
                      <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                      {course.prerequisites && course.prerequisites !== 'None' && (
                        <p className="text-xs text-muted-foreground mb-1"><span className="font-medium">Prereq:</span> {course.prerequisites}</p>
                      )}
                      {course.alternatives && course.alternatives.length > 0 && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">OR:</span> {course.alternatives.map(a => `${a.code} (${a.name})`).join(' · ')}
                        </p>
                      )}
                      {course.notes && <p className="text-xs text-accent mt-1">{course.notes}</p>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {['not_started', 'in_progress', 'completed'].map(s => (
                        <Button key={s} size="sm" variant={status === s ? 'default' : 'outline'}
                          className={`text-xs ${status === s ? '' : 'opacity-60'}`}
                          onClick={() => setCourseState(course.key, s)}>
                          {s === 'not_started' ? '📋 Not Started' : s === 'in_progress' ? '📚 In Progress' : '✅ Completed'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Grading Rules */}
          {dashboard.gradingRules && dashboard.gradingRules.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2"><CardTitle className="text-base">Grading & Selection Rules</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {dashboard.gradingRules.map((rule, i) => <li key={i} className="flex items-start gap-2"><span className="text-muted-foreground">•</span>{rule}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== CAL-GETC TAB ===== */}
        <TabsContent value="cal-getc" className="space-y-4 mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Cal-GETC General Education</h2>
            <p className="text-sm text-muted-foreground">Beginning Fall Quarter 2025, Cal-GETC is the required GE pattern for the AS-T. Full certification in all areas is required.</p>
            <Card className="mt-3 border-amber-200 bg-amber-50/30">
              <CardContent className="pt-4 text-sm">
                <strong>Important:</strong> Cal-GETC replaced CSU GE Breadth and IGETC beginning Fall 2025. Some major courses may <strong>double-count</strong> toward GE areas — confirm with your counselor to maximize efficiency!
              </CardContent>
            </Card>
          </div>

          {dashboard.calGetcAreas?.map(area => (
            <Card key={area.key} className={checklist[area.key] ? 'border-green-200 bg-green-50/30' : ''}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{area.area}</h3>
                      <span className="text-muted-foreground text-sm">{area.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{area.description}</p>
                    <p className="text-sm mb-2"><strong>Example Courses:</strong> {area.exampleCourses?.join(', ')}</p>
                    {area.doubleDip && (
                      <div className="text-sm text-green-700 bg-green-50 rounded p-2 mb-2">
                        ✅ DOUBLE-DIPPING OPPORTUNITY: {area.doubleDipNote}
                      </div>
                    )}
                    {area.notes && <p className="text-xs text-muted-foreground">{area.notes}</p>}
                    <div className="flex gap-1.5 mt-3">
                      {['not_started', 'in_progress', 'completed'].map(s => {
                        const isActive = checklist[area.key] ? s === 'completed' : s === 'not_started';
                        return (
                          <Button key={s} size="sm" variant={isActive ? 'default' : 'outline'}
                            className={`text-xs ${isActive ? '' : 'opacity-60'}`}
                            onClick={() => {
                              if (s === 'completed') toggleChecklist(area.key);
                              else if (checklist[area.key]) toggleChecklist(area.key);
                            }}>
                            {s === 'not_started' ? '📋 Not Started' : s === 'in_progress' ? '📚 In Progress' : '✅ Completed'}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* GE Notes */}
          {dashboard.geNotes && dashboard.geNotes.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2"><CardTitle className="text-base">GE Notes</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {dashboard.geNotes.map((n, i) => <li key={i} className="flex items-start gap-2"><span>•</span>{n}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== COURSE SEQUENCE TAB ===== */}
        <TabsContent value="course-sequence" className="space-y-4 mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Recommended Course Sequence</h2>
            <p className="text-sm text-muted-foreground">A smart quarter-by-quarter plan that respects all prerequisites and avoids the most common bottlenecks.</p>
            <Card className="mt-3 border-blue-200 bg-blue-50/30">
              <CardContent className="pt-4 text-sm">
                <strong>Note:</strong> This is a suggested planning framework — not an official schedule. Adjust based on your math placement level and counselor advice.
              </CardContent>
            </Card>
          </div>

          {dashboard.courseSequence?.map((term, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold">{term.term.replace(/[^\d]/g, '') || i + 1}</div>
                  <div>
                    <CardTitle className="text-base">{term.label || term.term}</CardTitle>
                    {term.description && <p className="text-xs text-muted-foreground mt-0.5">{term.description}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {term.courses.map((c, j) => (
                    <Badge key={j} variant={c.type === 'major' ? 'default' : c.type === 'ge' ? 'secondary' : 'outline'} className="text-sm py-1 px-3">
                      {c.code}{c.geArea ? ` (GE ${c.geArea})` : ''}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Bottlenecks */}
          {dashboard.sequenceBottlenecks && dashboard.sequenceBottlenecks.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2"><CardTitle className="text-base">⚠️ Sequencing Bottlenecks</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {dashboard.sequenceBottlenecks.map((b, i) => <li key={i} className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />{b}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Pro Tips */}
          {dashboard.sequenceProTips && dashboard.sequenceProTips.length > 0 && (
            <Card className="border-green-200 bg-green-50/30">
              <CardHeader className="pb-2"><CardTitle className="text-base">💡 Pro Tips</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {dashboard.sequenceProTips.map((t, i) => <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />{t}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== TRANSFER GUIDE TAB ===== */}
        <TabsContent value="transfer-guide" className="space-y-4 mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Transfer Guide</h2>
            <p className="text-sm text-muted-foreground">Step-by-step — everything you need to understand the CSU transfer process and how your AS-T works for you.</p>
          </div>

          {dashboard.transferGuide?.map(tg => (
            <Card key={tg.key}>
              <CardContent className="pt-5 flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold shrink-0">{tg.step}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{tg.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tg.description}</p>
                  {tg.link && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-1" asChild>
                      <a href={tg.link.url} target="_blank" rel="noopener noreferrer">{tg.link.label} <ExternalLink className="h-3 w-3 ml-1" /></a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Nearby CSUs */}
          {dashboard.nearbyCsus && dashboard.nearbyCsus.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Landmark className="h-4 w-4" /> CSU Schools Near {meta.communityCollege}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {dashboard.nearbyCsus.map((csu, i) => (
                  <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{csu.name}</h4>
                      <Badge variant="outline" className="text-xs">{csu.distance}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{csu.notes}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Key Transfer Deadlines */}
          {dashboard.transferDeadlines && dashboard.transferDeadlines.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">📅 Key Transfer Deadlines</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {dashboard.transferDeadlines.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <strong className="shrink-0">{d.date}:</strong>
                      <span className="text-muted-foreground">{d.description}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ADT Guarantee */}
          {dashboard.adtGuarantee && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-green-200">
                <CardHeader className="pb-2"><CardTitle className="text-base text-green-700">✅ What the AS-T Guarantees</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {dashboard.adtGuarantee.guarantees.map((g, i) => <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />{g}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-amber-200">
                <CardHeader className="pb-2"><CardTitle className="text-base text-amber-700">⚠️ What It Does NOT Guarantee</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {dashboard.adtGuarantee.doesNotGuarantee.map((g, i) => <li key={i} className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />{g}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ===== RESOURCES TAB ===== */}
        <TabsContent value="resources" className="space-y-4 mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold">Official Resources & Contacts</h2>
            <p className="text-sm text-muted-foreground">Every link and contact you'll need — bookmarked in one place.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.resources?.map((res, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-sm">{res.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{res.description}</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a href={res.url} target="_blank" rel="noopener noreferrer">
                      Visit <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Info */}
          {dashboard.contactInfo && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">📞 Counseling & Transfer Center Contact</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                {dashboard.contactInfo.generalCounseling && <p><strong>General Counseling:</strong> {dashboard.contactInfo.generalCounseling}</p>}
                {dashboard.contactInfo.transferCenter && <p><strong>Transfer Center:</strong> {dashboard.contactInfo.transferCenter}</p>}
                {dashboard.contactInfo.inPerson && <p><strong>In-Person:</strong> {dashboard.contactInfo.inPerson}</p>}
                {dashboard.contactInfo.dropIn && dashboard.contactInfo.dropIn.map((d, i) => <p key={i} className="text-muted-foreground">{d}</p>)}
              </CardContent>
            </Card>
          )}

          {/* Source info */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-4 text-sm">
              <h4 className="font-semibold mb-2">Source Information</h4>
              <p className="text-muted-foreground mb-2">{dashboard.sourceInfo?.basedOn}</p>
              <p className="text-muted-foreground text-xs mb-2">Last verified: {dashboard.sourceInfo?.lastVerified ? new Date(dashboard.sourceInfo.lastVerified).toLocaleDateString() : 'N/A'}</p>
              {dashboard.sourceInfo?.notes?.map((n, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-start gap-1"><Info className="h-3 w-3 mt-0.5 shrink-0" />{n}</p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RouteDashboardPage;
