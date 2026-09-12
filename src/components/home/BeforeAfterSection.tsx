import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

const tabs = [
  'College catalogs',
  'Transfer websites',
  'ASSIST',
  'Scholarship websites',
  'Spreadsheets',
  'Financial aid calculators',
  'Notes and deadlines',
];

export const BeforeAfterSection = () => (
  <section className="bg-white">
    <div className="mx-auto max-w-[1240px] px-6 py-20 lg:py-28">
      <Reveal>
        <h2
          className="text-center font-display font-bold text-berkeley"
          style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}
        >
          College planning shouldn't require 20 open tabs.
        </h2>
      </Reveal>

      <div className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">Without College Rules</p>
          <div className="relative mt-5 h-[280px]">
            {tabs.map((t, i) => (
              <div
                key={t}
                className="absolute rounded-xl border border-ink/10 bg-offwhite px-4 py-3 text-sm text-ink-muted shadow-sm"
                style={{
                  top: i * 32,
                  left: (i % 3) * 26,
                  transform: `rotate(${(i % 2 === 0 ? -1.5 : 1.8)}deg)`,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-softblue text-brightblue">
            <ArrowRight className="h-5 w-5" />
          </span>
        </Reveal>

        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brightblue">With College Rules</p>
          <div className="mt-5 rounded-2xl bg-berkeley p-8 text-white shadow-xl">
            <div className="font-display text-3xl font-bold">One dashboard.</div>
            <p className="mt-3 text-white/75">
              Your transfer plan, scholarships, applications and affordability in one place.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);
