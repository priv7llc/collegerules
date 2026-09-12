import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import dashboardShot from '@/assets/image-2.png.asset.json';
import { ProductFrame } from './ProductFrame';
import { Reveal } from './Reveal';

const steps = [
  { t: 'Tell us where you are', d: 'Community college + academic history' },
  { t: "Tell us where you're going", d: 'University + major' },
  { t: 'Get your roadmap', d: 'Courses, GE requirements, timeline and guidance' },
];

export const TransferPlannerSection = () => (
  <section id="transfer-planning" className="scroll-mt-20 bg-offwhite">
    <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brightblue">Transfer with a plan</p>
        <h2
          className="mt-4 font-display font-bold leading-tight text-berkeley"
          style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}
        >
          Stop guessing which<br />classes will transfer.
        </h2>
        <p className="mt-5 max-w-lg text-lg text-ink-muted">
          College Rules builds a personalized roadmap from your current college to your target university — based on
          your major, academic history and transfer requirements.
        </p>
        <ol className="mt-8 space-y-5">
          {steps.map((s, i) => (
            <li key={s.t} className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brightblue font-display text-sm font-bold text-white">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-berkeley">{s.t}</span>
                <span className="block text-sm text-ink-muted">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-berkeley px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-berkeley-deep"
        >
          Build My Route <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <Reveal>
        <ProductFrame src={dashboardShot.url} alt="Diablo Valley College transfer route dashboard in College Rules" />
        <p className="mt-6 text-center font-semibold text-berkeley">
          Built for California and Texas transfer pathways
        </p>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-ink-muted">
          CSU · UC · Private Universities · Cal-GETC · IGETC · ADT · Texas Core Curriculum · TCCNS · ApplyTexas · AAS →
          BAAS and more.
        </p>
      </Reveal>
    </div>
  </section>
);
