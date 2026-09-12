import createRouteShot from '@/assets/image-6.png.asset.json';
import { ProductFrame } from './ProductFrame';
import { Reveal } from './Reveal';

export const HowItWorksStrip = () => (
  <section id="how-it-works" className="scroll-mt-20 bg-white">
    <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-24">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brightblue">How it works</p>
        <h2
          className="mt-4 font-display font-bold leading-tight text-berkeley"
          style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}
        >
          Set up your route in a few minutes.
        </h2>
        <p className="mt-5 max-w-lg text-lg text-ink-muted">
          Answer a short set of questions about your state, community college, major and target university. College
          Rules does the research and builds your plan from there.
        </p>
      </Reveal>
      <Reveal>
        <ProductFrame src={createRouteShot.url} alt="Create route setup steps in College Rules" />
      </Reveal>
    </div>
  </section>
);
