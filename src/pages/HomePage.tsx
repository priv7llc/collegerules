import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Route as RouteIcon,
  Coins,
  PenLine,
  Stars,
  CheckCircle2,
} from 'lucide-react';

const HomePage = () => {
  return (
    <div className="bg-cream text-stone-900">
      {/* SECTION 1 — Top nav */}
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
          <Link to="/" className="font-display text-berkeley" style={{ fontSize: 22 }}>
            College Rules
          </Link>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden sm:inline text-sm text-stone-700 hover:text-berkeley">How it works</a>
            <Link to="/pricing" className="hidden sm:inline text-sm text-stone-700 hover:text-berkeley">Pricing</Link>
            <Link to="/login" className="text-sm text-berkeley font-semibold">Sign in</Link>
            <Link
              to="/signup"
              className="bg-berkeley text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-berkeley-deep transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 2 — Hero */}
      <section className="bg-gradient-to-b from-cream to-white">
        <div className="max-w-7xl mx-auto py-16 px-6 grid gap-12 lg:grid-cols-[1fr_440px] items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-gold-soft text-gold-deep px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              For California transfer students
            </span>
            <h1 className="font-display font-semibold text-5xl lg:text-6xl leading-tight text-berkeley mt-6">
            Plan your transfer.<br />
              <span className="text-gold">Find your scholarships.</span><br />
              Pay less for college.
            </h1>
            <p className="text-base text-stone-600 leading-relaxed max-w-md mt-4">
              College is expensive. The system is confusing. We built one place that handles all of it — your transfer roadmap, the scholarships you actually qualify for, AI essay help, and a real number for what you'll owe.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-gold text-berkeley-deep px-6 py-3 rounded-full font-bold shadow-lg shadow-gold/30 hover:shadow-xl transition"
              >
                Get started — $10 <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center bg-white text-berkeley border-2 border-berkeley px-6 py-3 rounded-full font-semibold hover:bg-berkeley-soft transition"
              >
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-stone-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              No subscription · 30-day money-back guarantee
            </div>
          </div>

          <div className="relative" style={{ height: 280 }}>
            {/* TODO: replace with hero image — recommend graduation/celebration photo */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-berkeley to-berkeley-deep">
              <div className="absolute bottom-4 left-4 text-white/90 font-display text-lg">
                Transfer day. Worth it.
              </div>
            </div>
            <div className="absolute -top-3 -right-4 bg-white rounded-2xl shadow-xl p-4 w-[140px]">
              <div className="font-bold text-berkeley text-2xl">$5,000</div>
              <span className="inline-block mt-1 bg-gold-soft text-gold-deep text-xs font-bold px-2 py-0.5 rounded-full">
                92% match
              </span>
            </div>
            <div className="absolute -bottom-3 -left-3.5 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 w-[220px]">
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-stone-900">Won!</div>
                <div className="text-xs text-stone-600">CCC Transfer Scholarship</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Three things */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto py-16 px-6">
          <div className="text-center max-w-xl mx-auto">
            <div className="text-xs font-bold text-gold-deep tracking-widest uppercase">Three things you can do here</div>
            <h2 className="font-display font-medium text-4xl text-berkeley mt-3">
              Everything you need, in one place.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-10">
            {[
              { icon: RouteIcon, iconBg: 'bg-berkeley-soft text-berkeley', title: 'Plan your transfer', desc: 'Get a personalized roadmap with course tracking, GE patterns, and deadlines for your target CSU or UC.', cta: 'Start a route', to: '/signup' },
              { icon: Coins, iconBg: 'bg-gold-soft text-gold-deep', title: 'Find your scholarships', desc: 'Match against your real profile. Live AI search any time. Track every application in one board.', cta: 'See your matches', to: '/signup' },
              { icon: PenLine, iconBg: 'bg-berkeley-soft text-berkeley', title: 'Write your essays', desc: 'AI writes a real first draft from your story. Improve, shorten, or strengthen with one click.', cta: 'Try the essay tool', to: '/signup' },
            ].map((c) => (
              <div key={c.title} className="bg-white border border-stone-200 rounded-2xl p-6 hover:border-berkeley hover:shadow-lg hover:-translate-y-0.5 transition">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-medium text-xl text-berkeley mt-4">{c.title}</h3>
                <p className="text-sm text-stone-600 mt-2">{c.desc}</p>
                <Link to={c.to} className="inline-flex items-center gap-1 text-berkeley font-semibold text-sm mt-4">
                  {c.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — Featured banner */}
      <section className="bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl text-white bg-gradient-to-br from-berkeley to-berkeley-deep" style={{ padding: '36px 28px' }}>
            {/* TODO: optionally add a background image with absolute inset-0 opacity-20 mix-blend-luminosity, behind the gradient overlay */}
            <div className="absolute bg-gold rounded-full blur-3xl opacity-40 pointer-events-none" style={{ top: -80, right: -80, width: 320, height: 320 }} />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gold tracking-widest">
                <Stars className="h-3.5 w-3.5" /> THE BIG IDEA
              </div>
              <h3 className="font-display font-medium text-3xl mt-3 max-w-2xl">
                Win your share of <span className="text-gold">$1.5 billion</span> in scholarships every year.
              </h3>
              <p className="text-sm text-white/85 max-w-md mt-3">
                29,000+ programs are giving away money each year. Most students don't apply because the process is overwhelming. We make it 10 minutes per scholarship instead of hours.
              </p>
              <Link to="/signup" className="inline-flex items-center gap-1 bg-gold text-berkeley-deep rounded-full px-5 py-2.5 font-bold mt-5">
                See your matches <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — Stats bar */}
      {/* TODO: replace with real metrics once available */}
      <section className="bg-white border-y border-stone-200">
        <div className="max-w-3xl mx-auto py-12 px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { num: '$2.4M+', label: 'in matches generated' },
            { num: '120+', label: 'CA campuses covered' },
            { num: '5', label: 'AI tools per essay' },
            { num: '10 min', label: 'average per app' },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display font-semibold text-4xl text-berkeley">{s.num}</div>
              <div className="text-xs text-stone-600 mt-1 tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 — How it works */}
      <section id="how-it-works" className="bg-cream">
        <div className="max-w-7xl mx-auto py-16 px-6">
          <div className="text-center max-w-xl mx-auto">
            <div className="text-xs font-bold text-gold-deep tracking-widest uppercase">How it works</div>
            <h2 className="font-display font-medium text-4xl text-berkeley mt-3">Four steps. One platform.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3.5 mt-10">
            {[
              { t: 'Build your profile once', d: 'Tell us your community college, major, GPA, and background. We use it everywhere — you never re-enter it.' },
              { t: 'Get matched with scholarships', d: "See real options ranked by fit. Hit 'Find more for me' anytime to AI-search the web for new ones." },
              { t: 'Apply with AI essay help', d: 'Generate a first draft in seconds. Improve, shorten, expand, or strengthen with one click.' },
              { t: "See what you'll really owe", d: 'Cost of attendance minus scholarships equals your gap. Know your number before you commit.' },
            ].map((s, i) => (
              <div key={s.t} className="bg-white border border-stone-200 rounded-2xl p-5 flex gap-3.5">
                <div className="h-8 w-8 rounded-full bg-berkeley text-white font-display font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-berkeley">{s.t}</div>
                  <div className="text-sm text-stone-600 mt-1">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — Testimonials */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-6">
          <div className="text-center max-w-xl mx-auto">
            <div className="text-xs font-bold text-gold-deep tracking-widest uppercase">Real students, real wins</div>
            <h2 className="font-display font-medium text-4xl text-berkeley mt-3">Built for students like you.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-3.5 mt-10">
            {/* TODO: replace avatar divs with real photos:
                <img src="..." className="w-10 h-10 rounded-full object-cover border-2 border-gold" /> */}
            {[
              { q: "Honestly thought I'd have to take out loans for SJSU. Won three scholarships. Now I'm paying nothing out of pocket.", n: 'Maria L.', s: "De Anza → SJSU '26", initials: 'ML', bg: 'bg-gold text-berkeley-deep' },
              { q: 'The AI essay tool is unreasonably good. Wrote my Hispanic Scholarship Fund essay in 20 minutes and won.', n: 'Jordan K.', s: "Foothill → UC Davis '26", initials: 'JK', bg: 'bg-berkeley text-white' },
              { q: "My counselor's office is booked weeks out. This gave me everything they would have, plus the scholarship stuff.", n: 'Aaliyah B.', s: "LBCC → CSULB '27", initials: 'AB', bg: 'bg-berkeley-soft text-berkeley' },
            ].map((t) => (
              <div key={t.n} className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col">
                <p className="text-sm text-stone-800 leading-relaxed flex-1">"{t.q}"</p>
                <div className="flex items-center gap-3 mt-5">
                  <div className={`h-10 w-10 rounded-full border-2 border-gold flex items-center justify-center font-semibold text-sm ${t.bg}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-stone-900">{t.n}</div>
                    <div className="text-xs text-stone-600">{t.s}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — Final CTA */}
      <section className="bg-gradient-to-b from-white to-cream">
        <div className="max-w-7xl mx-auto py-20 px-6 text-center">
          <h2 className="font-display font-semibold text-5xl text-berkeley">
            Stop wondering if you can afford it.
          </h2>
          <p className="text-base text-stone-600 max-w-sm mx-auto mt-4">
            Find out in the next 10 minutes.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-gold text-berkeley-deep px-6 py-3 rounded-full font-bold shadow-lg shadow-gold/30 hover:shadow-xl transition mt-8"
          >
            Get started — $10 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
