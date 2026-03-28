import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AdminPurchasesPage = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('purchases').select('*').order('created_at', { ascending: false });
      setPurchases(data || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Purchases</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Product</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : purchases.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No purchases yet</TableCell></TableRow>
              ) : purchases.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.id.slice(0, 8)}</TableCell>
                  <TableCell>{p.product_code}</TableCell>
                  <TableCell>${(p.amount_cents / 100).toFixed(2)}</TableCell>
                  <TableCell><Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPurchasesPage;
