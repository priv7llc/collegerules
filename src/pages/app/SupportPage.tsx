import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HelpCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const SupportPage = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll respond within 24 hours.');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Support</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />Quick FAQ</CardTitle></CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="1"><AccordionTrigger>How do I create a new route?</AccordionTrigger><AccordionContent>Click "Create Route" from your dashboard. You'll need route credits — purchase them from the Pricing page if needed.</AccordionContent></AccordionItem>
            <AccordionItem value="2"><AccordionTrigger>Can I get a refund?</AccordionTrigger><AccordionContent>Refunds are available within 7 days of purchase for unused credits. Contact us below.</AccordionContent></AccordionItem>
            <AccordionItem value="3"><AccordionTrigger>Is this official academic advising?</AccordionTrigger><AccordionContent>No. College Rules is a planning tool built from official sources. Always verify with your academic counselor.</AccordionContent></AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Contact Support</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Subject</Label><Input required /></div>
            <div><Label>Message</Label><Textarea rows={4} required /></div>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportPage;
