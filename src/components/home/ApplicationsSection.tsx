import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, PenLine, ShieldCheck } from 'lucide-react';
import applicationsShot from '@/assets/image-4.png.asset.json';
import { ProductFrame } from './ProductFrame';
import { Reveal } from './Reveal';

const features = [
  {
    icon: ShieldCheck,
    title: 'Check eligibility',
    desc: 'Know what you qualify for before spending time applying.',
  },
  {
    icon: PenLine,
    title: 'Write stronger essays',
    desc: 'Draft, improve, shorten or expand essays with AI assistance.',
  },
  {
    icon: ClipboardCheck,
    title: 'Never lose track',
    desc: 'See deadlines and application status in one place.',
  },
];

export const ApplicationsSection = () => (
  <section className="bg-white">
    <div className="mx-auto max-w-[1240px] px-6 py-20 lg:py-28">
      <Reveal className="max-w-2xl">
        <h2 className="font-display font-bold text-berkeley" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}>
          From “I should apply” to “submitted.”
        </h2>
        <p className="mt-4 text-lg text-ink-muted">
          Track every application, get AI help with essays, and never miss a deadline.
        </p>
      </Reveal>

      <div className="mt-12 grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <div className="space-y-7">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-deep">
                  <f.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-berkeley">{f.title}</span>
                  <span className="block text-sm text-ink-muted">{f.desc}</span>
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-berkeley px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-berkeley-deep"
          >
            Explore Scholarships <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal>
          <ProductFrame src={applicationsShot.url} alt="Scholarship application tracker board in College Rules" />
        </Reveal>
      </div>
    </div>
  </section>
);
