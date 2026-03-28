import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const ContactPage = () => {
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success('Message sent! We\'ll get back to you soon.');
      setSending(false);
    }, 1000);
  };

  return (
    <div className="py-20">
      <div className="container max-w-2xl">
        <h1 className="font-display text-4xl font-bold text-center mb-4">Contact & Support</h1>
        <p className="text-center text-muted-foreground mb-12">Have a question? We're here to help.</p>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Send us a message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="name">Name</Label><Input id="name" required /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required /></div>
              </div>
              <div><Label htmlFor="subject">Subject</Label><Input id="subject" required /></div>
              <div><Label htmlFor="message">Message</Label><Textarea id="message" rows={5} required /></div>
              <Button type="submit" disabled={sending} className="w-full">{sending ? 'Sending...' : 'Send Message'}</Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />support@collegerules.app
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Refunds available within 7 days for unused credits. College Rules is a planning tool — always verify requirements with your official academic counselor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
