import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Route, CreditCard, FolderOpen, Archive, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RouteRecord {
  id: string;
  route_name: string | null;
  community_college: string | null;
  major: string | null;
  destination_university: string | null;
  status: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  processing: 'bg-warning/20 text-warning',
  ready: 'bg-success/20 text-success',
  needs_review: 'bg-destructive/20 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

const MyRoutesPage = () => {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: routeData }, { data: creditData }] = await Promise.all([
      supabase.from('routes').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.rpc('get_remaining_credits', { _user_id: user.id }),
    ]);
    setRoutes((routeData as RouteRecord[]) || []);
    setCredits((creditData as number) || 0);
    setLoading(false);
  }, [user]);

  // Verify payment on return from Stripe
  useEffect(() => {
    if (!user || searchParams.get('payment') !== 'success') return;
    const verify = async () => {
      try {
        const { data } = await supabase.functions.invoke('verify-payment');
        if (data?.credited > 0) {
          toast.success(`${data.credited} credit${data.credited > 1 ? 's' : ''} added to your account!`);
        } else {
          toast.info('Payment received — credits already applied.');
        }
      } catch {
        toast.error('Could not verify payment. Credits may take a moment to appear.');
      }
      // Remove query param and reload data
      setSearchParams({}, { replace: true });
      loadData();
    };
    verify();
  }, [user, searchParams, setSearchParams, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">My Transfer Routes</h1>
          <p className="text-muted-foreground text-sm">Manage your transfer route dashboards</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{credits} credit{credits !== 1 ? 's' : ''} remaining</span>
          </div>
          {credits > 0 ? (
            <Button asChild><Link to="/app/create"><PlusCircle className="h-4 w-4 mr-2" />Create Route</Link></Button>
          ) : (
            <Button asChild><Link to="/app/buy-credits"><PlusCircle className="h-4 w-4 mr-2" />Buy Credits</Link></Button>
          )}
        </div>
      </div>

      {routes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">No routes yet</h3>
            <p className="text-muted-foreground text-sm mb-4 text-center max-w-sm">
              {credits > 0
                ? 'Create your first transfer route to get a personalized dashboard.'
                : 'Purchase route credits to get started with your transfer planning.'}
            </p>
            {credits > 0 ? (
              <Button asChild><Link to="/app/create">Create Your First Route</Link></Button>
            ) : (
              <Button asChild><Link to="/pricing">View Pricing</Link></Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routes.map(route => (
            <Card key={route.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold line-clamp-1">
                    {route.route_name || `${route.community_college} → ${route.destination_university}`}
                  </CardTitle>
                  <Badge className={statusColors[route.status] || ''} variant="secondary">{route.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  <p><span className="font-medium text-foreground">From:</span> {route.community_college}</p>
                  <p><span className="font-medium text-foreground">Major:</span> {route.major}</p>
                  <p><span className="font-medium text-foreground">To:</span> {route.destination_university}</p>
                </div>
                <div className="flex gap-2">
                  {route.status === 'ready' ? (
                    <Button size="sm" asChild className="flex-1"><Link to={`/app/route/${route.id}`}><Route className="h-4 w-4 mr-1" />Open Dashboard</Link></Button>
                  ) : route.status === 'processing' ? (
                    <Button size="sm" variant="secondary" disabled className="flex-1">Processing...</Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild className="flex-1"><Link to={`/app/route/${route.id}`}>View</Link></Button>
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

export default MyRoutesPage;
