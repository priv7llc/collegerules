import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, CreditCard, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: c }, { data: pur }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.rpc('get_remaining_credits', { _user_id: user.id }),
        supabase.from('purchases').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      setProfile(p);
      setCredits((c as number) || 0);
      setPurchases(pur || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Account</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={profile?.full_name || ''} disabled /></div>
          <div><Label>Email</Label><div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" />{user?.email}</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Credits & Billing</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary mb-4">{credits} credit{credits !== 1 ? 's' : ''} remaining</div>
          {purchases.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Purchase History</h4>
              {purchases.map(p => (
                <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2">
                  <span>{p.product_code === 'five_route_pack' ? '5 Routes' : '1 Route'}</span>
                  <span className="text-muted-foreground">${(p.amount_cents / 100).toFixed(2)}</span>
                  <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          )}
        </CardContent>
      </Card>

      <Button variant="outline" onClick={handleSignOut} className="w-full">
        <LogOut className="h-4 w-4 mr-2" />Log Out
      </Button>
    </div>
  );
};

export default AccountPage;
