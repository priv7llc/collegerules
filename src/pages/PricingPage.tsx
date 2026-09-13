import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const freeFeatures = [
  'Unlimited transfer routes',
  'Route Overview with your plan summary',
  'GE / transfer pattern checklist',
  'Scholarship matching & applications',
  'Save & return anytime',
];

const unlockFeatures = [
  'Affordability & cost gap analysis',
  'Major course requirements',
  'Term-by-term course sequence',
  'Transfer guide & milestones',
  'Official resource links',
];

const tiers = [
  {
    name: '1 Route Unlock',
    price: '$1',
    blurb: 'Open every section on one route.',
    badge: null as string | null,
  },
  {
    name: '5 Route Unlocks',
    price: '$3',
    blurb: 'Open every section on any five routes. Slots never expire.',
    badge: 'BEST VALUE',
  },
  {
    name: 'Unlimited Unlocks',
    price: '$10',
    blurb: 'Every section on every route you ever create.',
    badge: null,
  },
];

const PricingPage = () => {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Simple, One-Time Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Building transfer routes is free. Pay once — only when you want to open the in-depth sections.
          </p>
        </div>

        <Card className="border-2 shadow-md max-w-3xl mx-auto mb-12">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-xl">Free Account</CardTitle>
            <div className="text-4xl font-bold text-primary mt-2">$0</div>
            <p className="text-sm text-muted-foreground mt-1">No card required</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="grid gap-2 sm:grid-cols-2">
              {freeFeatures.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full mt-4"><Link to="/signup">Create Free Account</Link></Button>
          </CardContent>
        </Card>

        <div className="text-center mb-6">
          <h2 className="font-display text-2xl font-bold">Route unlocks</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
            Unlocks open Affordability, Major Courses, Course Sequence, Transfer Guide and Resources on a route.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          {tiers.map(t => (
            <Card key={t.name} className={`relative border-2 ${t.badge ? 'border-accent shadow-lg' : 'shadow-md'}`}>
              {t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {t.badge}
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-display text-xl">{t.name}</CardTitle>
                <div className="text-4xl font-bold text-primary mt-2">{t.price}</div>
                <p className="text-sm text-muted-foreground mt-1">One-time payment</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">{t.blurb}</p>
                <ul className="space-y-2">
                  {unlockFeatures.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full mt-4"><Link to="/signup">Get Started</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground max-w-lg mx-auto">
          <p>Built from official sources. Always verify requirements with your academic counselor. Requirements may change.</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
