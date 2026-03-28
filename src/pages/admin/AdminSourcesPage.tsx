import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const AdminSourcesPage = () => {
  const [colleges, setColleges] = useState<any[]>([]);
  const [newCollege, setNewCollege] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('source_colleges').select('*').order('college_name');
    setColleges(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addCollege = async () => {
    if (!newCollege.trim()) return;
    await supabase.from('source_colleges').insert({ college_name: newCollege.trim(), state: 'California' });
    setNewCollege('');
    toast.success('College added');
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Source Data</h1>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Source Colleges</h3>
          <div className="flex gap-2 mb-4">
            <Input value={newCollege} onChange={e => setNewCollege(e.target.value)} placeholder="Add new college..." />
            <Button onClick={addCollege}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>College Name</TableHead><TableHead>State</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
            <TableBody>
              {colleges.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.college_name}</TableCell>
                  <TableCell>{c.state}</TableCell>
                  <TableCell>{c.active ? '✓' : '✗'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSourcesPage;
