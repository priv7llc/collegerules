import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import scholarshipsShot from '@/assets/image-5.png.asset.json';
import { ProductFrame } from './ProductFrame';
import { Reveal } from './Reveal';

export const ScholarshipSection = () => (
  <section id="scholarships" className="scroll-mt-20 bg-softblue">
    <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:py-28">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brightblue">Scholarships that fit you</p>
        <h2
          className="mt-4 font-display font-bold leading-tight text-berkeley"
          style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}
        >
          Spend less time searching.<br />More time applying.
        </h2>
        <p className="mt-5 max-w-lg text-lg text-ink-muted">
          College Rules matches scholarships to your academics, finances, background and goals — then helps you through
          the application.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-berkeley px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-berkeley-deep"
        >
          Find My Scholarships <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <Reveal>
        <ProductFrame src={scholarshipsShot.url} alt="Personalized scholarship matches in College Rules" />
      </Reveal>
    </div>
  </section>
);
