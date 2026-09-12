import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

const rows = [
  { label: 'Cost of Attendance', value: '$42,736', tone: 'text-white' },
  { label: 'Grants & Aid', value: '−$18,400', tone: 'text-emeraldbrand' },
  { label: 'Scholarships', value: '−$7,500', tone: 'text-emeraldbrand' },
  { label: 'Expected Family Contribution', value: '−$4,000', tone: 'text-emeraldbrand' },
];

export const AffordabilitySection = () => (
  <section className="bg-berkeley-deep">
    <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brightblue-light">
          Know the numbers before you transfer
        </p>
        <h2
          className="mt-4 font-display font-bold leading-tight text-white"
          style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}
        >
          Can I actually afford<br />this school?
        </h2>
        <p className="mt-5 max-w-lg text-lg text-white/75">
          Compare estimated college costs with grants, scholarships and your expected contribution so you can make
          smarter decisions before transferring.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
        >
          See Affordability Tools <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <Reveal>
        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <div className="text-sm font-semibold text-berkeley">Affordability Estimate</div>
          <div className="mt-3 rounded-lg border border-ink/15 px-3 py-2.5 text-sm text-ink">UC Berkeley</div>

          <div className="mt-5 grid gap-6 sm:grid-cols-[1.2fr_0.8fr] sm:items-center">
            <div>
              <dl className="space-y-2.5 text-sm">
                {rows.map((r) => (
                  <div key={r.label} className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-muted">{r.label}</dt>
                    <dd className={r.tone === 'text-white' ? 'font-semibold text-ink' : 'font-semibold text-emeraldbrand'}>
                      {r.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-baseline justify-between rounded-lg bg-softblue px-3 py-3">
                <span className="text-sm font-semibold text-berkeley">Estimated Funding Gap</span>
                <span className="font-display text-lg font-bold text-berkeley">$12,836</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div
                className="relative flex h-32 w-32 items-center justify-center rounded-full"
                style={{ background: 'conic-gradient(#2563EB 0% 70%, #EEF5FF 70% 100%)' }}
                role="img"
                aria-label="70 percent of costs funded"
              >
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                  <span className="font-display text-xl font-bold text-berkeley">70%</span>
                  <span className="text-xs text-ink-muted">funded</span>
                </div>
              </div>
              <ul className="mt-4 space-y-1 text-xs text-ink-muted">
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brightblue" /> $29,900 Funded
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-softblue" /> $12,836 Gap
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-5 text-xs text-ink-muted">Example figures. Your estimate is built from your own profile.</p>
        </div>
      </Reveal>
    </div>
  </section>
);
