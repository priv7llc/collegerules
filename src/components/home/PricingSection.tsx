import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Reveal } from './Reveal';

const plans = [
  {
    name: 'Free Account',
    price: '$0',
    features: ['Scholarship profile', 'Scholarship matching', 'Application tracking', 'College planning tools'],
    cta: 'Create Free Account',
    to: '/signup',
    highlight: false,
  },
  {
    name: 'Transfer Route',
    price: '$10',
    features: ['1 personalized route'],
    cta: 'Build My Route',
    to: '/pricing',
    highlight: false,
  },
  {
    name: 'Best Value',
    price: '$25',
    features: ['5 personalized routes'],
    cta: 'Get 5 Routes',
    to: '/pricing',
    highlight: true,
  },
];

export const PricingSection = () => (
  <section id="pricing" className="scroll-mt-20 bg-offwhite">
    <div className="mx-auto max-w-[1240px] px-6 py-20 lg:py-28">
      <Reveal className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brightblue">Simple pricing</p>
        <h2 className="mt-4 font-display font-bold text-berkeley" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}>
          Start planning for free.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <Reveal key={p.name}>
            <div
              className={`relative flex h-full flex-col rounded-2xl border bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg ${
                p.highlight ? 'border-brightblue shadow-md' : 'border-ink/10'
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-gold px-3 py-1 text-xs font-bold text-berkeley-deep">
                  Best Value
                </span>
              )}
              <div className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{p.name}</div>
              <div className="mt-2 font-display text-4xl font-bold text-berkeley">{p.price}</div>
              <ul className="mt-5 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink">
                    <Check className="h-4 w-4 text-emeraldbrand" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to={p.to}
                className={`mt-7 rounded-full px-5 py-3 text-center text-sm font-semibold transition hover:-translate-y-0.5 ${
                  p.highlight
                    ? 'bg-brightblue text-white hover:bg-brightblue-light'
                    : 'bg-berkeley text-white hover:bg-berkeley-deep'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-muted">
        A route is a personalized transfer plan for one community college, major and target university. Scholarships,
        applications and planning tools stay free with your account.
      </p>
    </div>
  </section>
);
