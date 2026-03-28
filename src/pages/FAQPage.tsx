import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: 'What is a transfer route?', a: 'A route is one specific transfer path: your community college + your major + your destination university. Each route generates its own personalized dashboard with courses, requirements, and checklists.' },
  { q: 'What do I get with a route?', a: 'You get a fully interactive dashboard with major course tracking, GE/transfer pattern completion, a term-by-term course sequence, transfer guide with milestones, official resource links, and interactive checklists — all specific to your route.' },
  { q: 'Can I buy multiple routes?', a: 'Yes! The 5-route pack lets you create up to 5 separate routes. Each route has its own isolated dashboard and progress tracking. Great for exploring different transfer options.' },
  { q: 'Is this a subscription?', a: 'No. It\'s a one-time payment. Once you purchase route credits, they don\'t expire and your dashboards remain accessible.' },
  { q: 'Does this replace my academic counselor?', a: 'No. College Rules is a planning and organization tool. All data is built from official sources, but you should always verify requirements with your academic counselor. Requirements may change.' },
  { q: 'What colleges and universities are supported?', a: 'We\'re continuously expanding our coverage. Currently focused on California community colleges and UC/CSU transfer paths. Check back for updates or contact us for specific requests.' },
  { q: 'Can I get a refund?', a: 'We offer refunds within 7 days of purchase if you haven\'t used your route credits. Contact support for assistance.' },
  { q: 'How do I save my progress?', a: 'Progress is automatically saved to your account. You can log out and return anytime to see your checked-off items and course progress.' },
];

const FAQPage = () => {
  return (
    <div className="py-20">
      <div className="container max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-center mb-4">Frequently Asked Questions</h1>
        <p className="text-center text-muted-foreground mb-12">Everything you need to know about College Rules.</p>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQPage;
