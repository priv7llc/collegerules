import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, CheckCircle2, BookOpen, MapPin, ArrowRight, Shield, Clock, Target } from 'lucide-react';

const HomePage = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(199_89%_48%/0.15),transparent_60%)]" />
        <div className="container relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground/80 mb-6">
              <GraduationCap className="h-4 w-4" />
              Your personalized transfer planning dashboard
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Plan your college transfer with clarity and confidence
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl">
              Get a route-based transfer roadmap with course tracking, checklists, and next steps — built from official sources. Organize your entire transfer path in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="secondary" asChild className="text-primary font-semibold">
                <Link to="/signup">Get Started — $10 <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Three simple steps to get your personalized transfer dashboard.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '1', icon: MapPin, title: 'Pick Your Route', desc: 'Tell us your community college, major, and destination university.' },
              { step: '2', icon: Target, title: 'Get Your Dashboard', desc: 'We generate a personalized dashboard with courses, requirements, and a checklist.' },
              { step: '3', icon: CheckCircle2, title: 'Track Your Progress', desc: 'Check off completed items, track courses, and stay on top of deadlines.' },
            ].map(item => (
              <Card key={item.step} className="relative border-none shadow-md">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-xs font-bold text-accent mb-2">STEP {item.step}</div>
                  <h3 className="font-display text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-20 bg-card">
        <div className="container">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">What You Get</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Everything you need to plan a successful transfer.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BookOpen, title: 'Major Course Tracker', desc: 'See every required course for your major with completion tracking.' },
              { icon: CheckCircle2, title: 'Interactive Checklists', desc: 'Action items and milestones you can check off as you go.' },
              { icon: Clock, title: 'Course Sequence', desc: 'Term-by-term suggested schedule with prerequisite warnings.' },
              { icon: MapPin, title: 'Transfer Guide', desc: 'Application timelines, key dates, and destination-specific reminders.' },
              { icon: Shield, title: 'Official Resources', desc: 'Direct links to catalogs, articulation agreements, and counselor info.' },
              { icon: Target, title: 'GE/Transfer Patterns', desc: 'Track general education and transfer pattern completion.' },
            ].map(item => (
              <Card key={item.title} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <item.icon className="h-6 w-6 text-accent mb-3" />
                  <h3 className="font-display font-bold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 bg-background">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Simple, Affordable Pricing</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">One-time payment. No subscriptions. Your dashboard stays available as long as you need it.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-2xl mx-auto">
            <Card className="flex-1 border-2 shadow-md">
              <CardContent className="pt-6 text-center">
                <h3 className="font-display font-bold text-lg mb-1">1 Route</h3>
                <div className="text-3xl font-bold text-primary mb-2">$10</div>
                <p className="text-sm text-muted-foreground mb-4">Perfect if you know your path</p>
                <Button asChild className="w-full"><Link to="/signup">Get Started</Link></Button>
              </CardContent>
            </Card>
            <Card className="flex-1 border-2 border-accent shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</div>
              <CardContent className="pt-6 text-center">
                <h3 className="font-display font-bold text-lg mb-1">5 Routes</h3>
                <div className="text-3xl font-bold text-primary mb-2">$25</div>
                <p className="text-sm text-muted-foreground mb-4">Explore multiple transfer paths</p>
                <Button asChild className="w-full"><Link to="/signup">Get Started</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 bg-card border-t">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            College Rules is a planning and organization platform. All route data is built from official sources. Always verify requirements with your academic counselor. Requirements may change — check with your transfer center for the latest information.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to plan your transfer?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">Get your personalized transfer dashboard in minutes.</p>
          <Button size="lg" variant="secondary" asChild className="text-primary font-semibold">
            <Link to="/signup">Create Your Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
