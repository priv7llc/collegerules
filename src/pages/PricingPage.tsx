import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const features = [
  'Personalized transfer dashboard',
  'Interactive course checklists',
  'Major course tracking with progress',
  'GE/Transfer pattern completion',
  'Term-by-term course sequence',
  'Official resource links',
  'Transfer guide & milestones',
  'Save & return anytime',
];

const PricingPage = () => {
  return (
    <div className="py-20">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Simple, One-Time Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            No subscriptions. Buy your routes once and access your dashboards anytime.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
          {/* Single Route */}
          <Card className="border-2 shadow-md">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-xl">1 Transfer Route</CardTitle>
              <div className="text-4xl font-bold text-primary mt-2">$10</div>
              <p className="text-sm text-muted-foreground mt-1">One-time payment</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                One route = one community college + one major + one destination university
              </p>
              <ul className="space-y-2">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full mt-4"><Link to="/signup">Buy 1 Route</Link></Button>
            </CardContent>
          </Card>

          {/* 5-Route Pack */}
          <Card className="border-2 border-accent shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</div>
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-xl">5 Transfer Routes</CardTitle>
              <div className="text-4xl font-bold text-primary mt-2">$25</div>
              <p className="text-sm text-muted-foreground mt-1">One-time payment · Save $25</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Five separate routes. Explore different colleges, majors, or universities.
              </p>
              <ul className="space-y-2">
                {features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  5 separate dashboards with isolated progress
                </li>
              </ul>
              <Button asChild className="w-full mt-4"><Link to="/signup">Buy 5 Routes</Link></Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 text-sm text-muted-foreground max-w-lg mx-auto">
          <p>Built from official sources. Always verify requirements with your academic counselor. Requirements may change.</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
