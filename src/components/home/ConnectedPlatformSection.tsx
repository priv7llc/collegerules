import { ArrowDown } from 'lucide-react';
import { Reveal } from './Reveal';

const outcomes = [
  { t: 'Transfer Plan', d: 'Know what courses you need' },
  { t: 'Scholarship Matches', d: 'Know what funding you qualify for' },
  { t: 'Affordability', d: 'Know what you may still need' },
];

export const ConnectedPlatformSection = () => (
  <section className="bg-white">
    <div className="mx-auto max-w-[1240px] px-6 py-20 lg:py-28">
      <Reveal className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brightblue">One profile. One plan.</p>
        <h2
          className="mt-4 font-display font-bold text-berkeley"
          style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}
        >
          Everything works together.
        </h2>
      </Reveal>

      <Reveal className="mt-12">
        <div className="mx-auto w-full max-w-sm rounded-2xl bg-berkeley px-6 py-4 text-center font-display font-bold text-white">
          Your Profile
        </div>
        <div className="flex justify-center py-4">
          <ArrowDown className="h-5 w-5 text-brightblue" />
        </div>
        <div className="relative grid gap-5 md:grid-cols-3">
          <div className="pointer-events-none absolute left-0 right-0 top-[-18px] hidden h-px bg-ink/10 md:block" />
          {outcomes.map((o) => (
            <div
              key={o.t}
              className="rounded-2xl border border-ink/10 bg-offwhite p-6 text-center transition hover:-translate-y-1 hover:border-brightblue"
            >
              <div className="font-display text-lg font-bold text-berkeley">{o.t}</div>
              <p className="mt-2 text-sm text-ink-muted">{o.d}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center py-4">
          <ArrowDown className="h-5 w-5 text-brightblue" />
        </div>
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-brightblue/30 bg-softblue px-6 py-4 text-center font-display font-bold text-berkeley">
          One clearer path to graduation
        </div>
      </Reveal>
    </div>
  </section>
);
