import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Reveal } from './Reveal';

const faqs = [
  {
    q: 'What is a transfer route?',
    a: 'A route is a personalized transfer plan built for one community college, one major and one target university. It includes your course requirements, general education pattern, suggested sequence, transfer guidance and affordability tools.',
  },
  {
    q: 'Do I need to pay to use College Rules?',
    a: 'No. Creating an account, building your scholarship profile, viewing matches and tracking applications are free. Building transfer routes is free too — unlocking a route’s full details is $1 for one route, $3 for five, or $10 for unlimited.',
  },
  {
    q: 'Which states are supported?',
    a: 'California and Texas transfer pathways are supported today, including CSU, UC and private universities in California and Texas public universities. More states are coming.',
  },
  {
    q: 'Where does the information come from?',
    a: 'Routes are built from published college catalogs, transfer requirements and articulation information, then organized into a plan for your situation.',
  },
  {
    q: 'Does this replace my counselor?',
    a: 'No. College Rules is a planning tool, not official academic advising. Always confirm your plan and scholarship details with your counselor and the sponsoring organization.',
  },
];

export const FAQSection = () => (
  <section id="faq" className="scroll-mt-20 bg-white">
    <div className="mx-auto max-w-3xl px-6 py-20 lg:py-28">
      <Reveal className="text-center">
        <h2 className="font-display font-bold text-berkeley" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}>
          Questions, answered.
        </h2>
      </Reveal>
      <Reveal className="mt-10">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-semibold text-berkeley">{f.q}</AccordionTrigger>
              <AccordionContent className="text-ink-muted">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </div>
  </section>
);
