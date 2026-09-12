import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';

export const FinalCTA = () => (
  <section className="bg-berkeley">
    <div className="mx-auto max-w-[1240px] px-6 py-20 text-center lg:py-24">
      <Reveal>
        <h2 className="font-display font-bold text-white" style={{ fontSize: 'clamp(1.9rem, 3.6vw, 3rem)' }}>
          Your transfer plan starts today.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
          Create a free account and see your courses, scholarships and costs in one place.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-bold text-berkeley-deep transition hover:-translate-y-0.5"
        >
          Get Started Free <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </div>
  </section>
);
