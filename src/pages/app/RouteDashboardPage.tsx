import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, CheckCircle2, AlertTriangle, Info, ExternalLink, GraduationCap, Calendar, Target, MapPin, RotateCcw } from 'lucide-react';
import type { DashboardPayload } from '@/lib/mockDashboard';

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
    const load = async () => {
      const [{ data: r }, { data: d }, { data: cl }, { data: cp }] = await Promise.all([
        supabase.from('routes').select('*').eq('id', routeId).single(),
        supabase.from('route_dashboards').select('*').eq('route_id', routeId).order('version', { ascending: false }).limit(1).single(),
        supabase.from('checklist_progress').select('*').eq('route_id', routeId),
        supabase.from('course_progress').select('*').eq('route_id', routeId),
      ]);
      setRoute(r);
      if (d) setDashboard(d.dashboard_payload as unknown as DashboardPayload);
      const clMap: Record<string, boolean> = {};
      cl?.forEach((c: any) => { clMap[c.item_key] = c.completed; });
      setChecklist(clMap);
      const cpMap: Record<string, string> = {};
      cp?.forEach((c: any) => { cpMap[c.course_key] = c.status; });
      setCourseStatus(cpMap);
      setLoading(false);
    };
    load();
  }, [routeId, user]);

  const toggleChecklist = useCallback(async (key: string) => {
    if (!routeId) return;
    const newVal = !checklist[key];
    setChecklist(prev => ({ ...prev, [key]: newVal }));
    await supabase.from('checklist_progress').upsert({
      route_id: routeId, item_key: key, completed: newVal, completed_at: newVal ? new Date().toISOString() : null,
    }, { onConflict: 'route_id,item_key' });
  }, [routeId, checklist]);

  const updateCourseStatus = useCallback(async (key: string, status: string) => {
    if (!routeId) return;
    setCourseStatus(prev => ({ ...prev, [key]: status }));
    await supabase.from('course_progress').upsert({
      route_id: routeId, course_key: key, status,
    }, { onConflict: 'route_id,course_key' });
  }, [routeId]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!route || !dashboard) return <div className="text-center py-12"><p className="text-muted-foreground">Route not found or still processing.</p><Button asChild className="mt-4"><Link to="/app">Back to Routes</Link></Button></div>;

  const meta = dashboard.routeMeta;
  const majorTotal = dashboard.majorCourses.length;
  const majorDone = dashboard.majorCourses.filter(c => courseStatus[c.key] === 'completed').length;
  const geTotal = dashboard.geTransfer.reduce((s, g) => s + g.required, 0);
  const geDone = Math.min(geTotal, dashboard.geTransfer.filter(g => checklist[`ge_${g.area}`]).length * 2);
  const checklistTotal = dashboard.quickStartChecklist.length;
  const checklistDone = dashboard.quickStartChecklist.filter(c => checklist[c.key]).length;
  const readyPct = Math.round(((majorDone + geDone + checklistDone) / (majorTotal + geTotal + checklistTotal)) * 100);

  const iconMap: Record<string, any> = { map: MapPin, book: BookOpen, calendar: Calendar, alert: AlertTriangle };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" asChild><Link to="/app"><ArrowLeft className="h-4 w-4 mr-1" />My Routes</Link></Button>
      </div>

      <div className="bg-primary rounded-xl p-6 text-primary-foreground">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-6 w-6" />
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">{route.status}</Badge>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{meta.communityCollege} → {meta.destinationUniversity}</h1>
            <p className="text-primary-foreground/80 mt-1">{meta.major} · {meta.destinationProgram} · {meta.transferTerm}</p>
          </div>
          <div className="text-sm text-primary-foreground/60">
            Updated {new Date(meta.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Major Courses', value: majorDone, total: majorTotal, color: 'text-primary' },
          { label: 'GE / Transfer', value: geDone, total: geTotal, color: 'text-accent' },
          { label: 'Action Items', value: checklistDone, total: checklistTotal, color: 'text-warning' },
          { label: 'Route Ready', value: readyPct, total: 100, color: 'text-success', pct: true },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">{m.label}</p>
              <p className={`text-2xl font-bold ${m.color}`}>{m.pct ? `${m.value}%` : `${m.value}/${m.total}`}</p>
              <Progress value={(m.value / m.total) * 100} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0">
          {['Overview', 'Major Courses', 'GE / Transfer', 'Course Sequence', 'Transfer Guide', 'Resources'].map(t => (
            <TabsTrigger key={t} value={t.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')} className="data-[state=active]:bg-card data-[state=active]:shadow-sm">{t}</TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.overviewCards.map((card, i) => {
              const Icon = iconMap[card.icon] || Target;
              return (
                <Card key={i}>
                  <CardContent className="pt-5 flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-5 w-5 text-primary" /></div>
                    <div><h3 className="font-semibold text-sm">{card.title}</h3><p className="text-sm text-muted-foreground">{card.description}</p></div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Warnings */}
          {dashboard.warnings.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Important Notes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {dashboard.warnings.map((w, i) => (
                  <div key={i} className={`flex items-start gap-2 text-sm rounded-md p-3 ${
                    w.type === 'critical' ? 'bg-destructive/10 text-destructive' : w.type === 'warning' ? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'
                  }`}>
                    {w.type === 'critical' ? <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> : <Info className="h-4 w-4 mt-0.5 shrink-0" />}
                    {w.message}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Start Checklist */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Quick-Start Action Items</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {dashboard.quickStartChecklist.map(item => (
                <label key={item.key} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={!!checklist[item.key]} onCheckedChange={() => toggleChecklist(item.key)} />
                  <span className={`text-sm flex-1 ${checklist[item.key] ? 'line-through text-muted-foreground' : ''}`}>{item.label}</span>
                  <Badge variant="outline" className="text-xs">{item.priority}</Badge>
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Major Courses */}
        <TabsContent value="major-courses" className="space-y-4 mt-4">
          {dashboard.majorCourses.map(course => (
            <Card key={course.key}>
              <CardContent className="pt-5">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{course.code}</h3>
                      <span className="text-muted-foreground text-sm">· {course.units} units</span>
                    </div>
                    <p className="font-medium text-sm mb-1">{course.name}</p>
                    <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                    {course.prerequisites !== 'None' && <p className="text-xs text-muted-foreground"><span className="font-medium">Prerequisites:</span> {course.prerequisites}</p>}
                    {course.notes && <p className="text-xs text-accent mt-1">{course.notes}</p>}
                  </div>
                  <Select value={courseStatus[course.key] || 'not_started'} onValueChange={v => updateCourseStatus(course.key, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* GE / Transfer */}
        <TabsContent value="ge---transfer" className="space-y-4 mt-4">
          {dashboard.geTransfer.map(ge => (
            <Card key={ge.area}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{ge.area}: {ge.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Required: {ge.required} course(s)</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ge.courses.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                    </div>
                    {ge.notes && <p className="text-xs text-muted-foreground mt-2">{ge.notes}</p>}
                  </div>
                  <Checkbox checked={!!checklist[`ge_${ge.area}`]} onCheckedChange={() => toggleChecklist(`ge_${ge.area}`)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Course Sequence */}
        <TabsContent value="course-sequence" className="space-y-4 mt-4">
          {dashboard.courseSequence.map(term => (
            <Card key={term.term}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />{term.term}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {term.courses.map(c => (
                    <div key={c.code} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={c.type === 'major' ? 'default' : c.type === 'ge' ? 'secondary' : 'outline'} className="text-xs">{c.type}</Badge>
                        <span className="font-medium">{c.code}</span>
                        <span className="text-muted-foreground">{c.name}</span>
                      </div>
                      <span className="text-muted-foreground">{c.units} units</span>
                    </div>
                  ))}
                </div>
                {term.warnings.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 mt-3 text-sm text-warning bg-warning/10 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 shrink-0" />{w}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Transfer Guide */}
        <TabsContent value="transfer-guide" className="space-y-3 mt-4">
          {dashboard.transferGuide.map(tg => (
            <label key={tg.key} className="block">
              <Card className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 flex items-start gap-3">
                  <Checkbox checked={!!checklist[tg.key]} onCheckedChange={() => toggleChecklist(tg.key)} className="mt-1" />
                  <div>
                    <h3 className={`font-semibold text-sm ${checklist[tg.key] ? 'line-through text-muted-foreground' : ''}`}>{tg.milestone}</h3>
                    <p className="text-xs text-accent">{tg.timing}</p>
                    <p className="text-sm text-muted-foreground mt-1">{tg.description}</p>
                  </div>
                </CardContent>
              </Card>
            </label>
          ))}
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources" className="space-y-3 mt-4">
          {dashboard.resources.map((res, i) => (
            <Card key={i}>
              <CardContent className="pt-4 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm">{res.title}</h3>
                  <p className="text-sm text-muted-foreground">{res.description}</p>
                  <Badge variant="outline" className="text-xs mt-1">{res.type}</Badge>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={res.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1" />Visit</a>
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Source info */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-4 text-sm">
              <h4 className="font-semibold mb-2">Source Information</h4>
              <p className="text-muted-foreground mb-2">{dashboard.sourceInfo.basedOn}</p>
              <p className="text-muted-foreground text-xs mb-2">Last verified: {new Date(dashboard.sourceInfo.lastVerified).toLocaleDateString()}</p>
              {dashboard.sourceInfo.notes.map((n, i) => (
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
