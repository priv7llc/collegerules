import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, Trophy } from 'lucide-react';
import routesShot from '@/assets/image.png.asset.json';
import { ProductFrame } from './ProductFrame';

const trust = ['Free to join', 'No credit card required', 'Built for CA & TX'];

export const HeroSection = () => (
  <section className="bg-gradient-to-b from-offwhite to-white">
    <div className="mx-auto grid max-w-[1240px] items-center gap-14 px-6 py-20 lg:grid-cols-[1fr_1.05fr] lg:py-28">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brightblue">
          College planning, built around you
        </p>
        <h1
          className="mt-5 font-display font-bold leading-[1.05] text-berkeley"
          style={{ fontSize: 'clamp(2.5rem, 5.2vw, 4.25rem)' }}
        >
          Your path to a<br />four-year degree<br />
          <span className="text-brightblue">starts here.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
          Build a personalized transfer plan, find scholarships you actually qualify for, and understand what college
          will really cost — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-berkeley px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-berkeley-deep"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-full border border-ink/15 bg-white px-6 py-3.5 font-semibold text-berkeley transition hover:-translate-y-0.5 hover:border-brightblue hover:text-brightblue"
          >
            See How It Works
          </a>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {trust.map((t) => (
            <li key={t} className="flex items-center gap-1.5 text-sm text-ink-muted">
              <Check className="h-4 w-4 text-brightblue" /> {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative pb-24 sm:pb-16 lg:pb-20">
        <ProductFrame src={routesShot.url} alt="College Rules My Transfer Routes dashboard" />

        <div className="mt-4 grid gap-4 sm:absolute sm:-bottom-2 sm:left-0 sm:right-0 sm:mt-0 sm:grid-cols-2 sm:px-4">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <Trophy className="h-4 w-4 text-gold-deep" /> Scholarship Match
            </div>
            <div className="mt-2 text-sm font-semibold text-berkeley">Osher Initiative Scholarship</div>
            <div className="mt-1 font-display text-2xl font-bold text-emeraldbrand">100% match</div>
            <div className="mt-1 text-xs text-ink-muted">$1,000 · Deadline Oct 3, 2026</div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <BarChart3 className="h-4 w-4 text-brightblue" /> Estimated Funding Gap
            </div>
            <div className="mt-2 font-display text-2xl font-bold text-berkeley">$8,420</div>
            <div className="mt-1 text-xs text-emeraldbrand">↓ $3,500 after scholarships</div>
            <Link to="/signup" className="mt-1 inline-block text-xs font-semibold text-brightblue">
              View Affordability
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);
