import { Check, Globe } from 'lucide-react';
import { Reveal } from './Reveal';

const states = [
  {
    name: 'California',
    path: 'Community College → CSU / UC / Private',
    items: ['Cal-GETC', 'IGETC', 'ADT', 'ASSIST articulation', 'Major preparation'],
  },
  {
    name: 'Texas',
    path: 'Community College → Texas Universities',
    items: ['Texas Core Curriculum', 'TCCNS', 'ApplyTexas pathways', 'AAS → BAAS'],
  },
];

export const StateSupportSection = () => (
  <section className="bg-offwhite">
    <div className="mx-auto max-w-[1240px] px-6 py-20 lg:py-28">
      <Reveal>
        <h2
          className="text-center font-display font-bold text-berkeley"
          style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}
        >
          Built for the way transfer actually works.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1fr_0.7fr]">
        {states.map((s) => (
          <Reveal key={s.name}>
            <div className="h-full rounded-2xl border border-ink/10 bg-white p-7 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="font-display text-2xl font-bold text-berkeley">{s.name}</div>
              <p className="mt-1 text-sm text-ink-muted">{s.path}</p>
              <ul className="mt-5 space-y-2">
                {s.items.map((i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink">
                    <Check className="h-4 w-4 text-emeraldbrand" /> {i}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
        <Reveal>
          <div className="h-full rounded-2xl border border-dashed border-ink/20 bg-white p-7">
            <Globe className="h-6 w-6 text-brightblue" />
            <div className="mt-4 font-display text-lg font-bold text-berkeley">More states coming soon.</div>
            <p className="mt-2 text-sm text-ink-muted">
              We're expanding to help more students across the country.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);
