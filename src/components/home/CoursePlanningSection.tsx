import { Check } from 'lucide-react';
import coursesShot from '@/assets/image-3.png.asset.json';
import { ProductFrame } from './ProductFrame';
import { Reveal } from './Reveal';

const points = [
  'Major requirements',
  'General education',
  'Course sequence',
  'Transfer guidance',
  'Progress tracking',
];

export const CoursePlanningSection = () => (
  <section className="bg-white">
    <div className="mx-auto max-w-[1240px] px-6 py-20 lg:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display font-bold text-berkeley" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}>
          See exactly what you need to take.
        </h2>
        <p className="mt-4 text-lg text-ink-muted">
          Turn complicated transfer requirements into a clear course-by-course roadmap.
        </p>
      </Reveal>

      <Reveal className="mt-12">
        <ProductFrame src={coursesShot.url} alt="Major course requirements tracker in College Rules" />
      </Reveal>

      <ul className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2 text-ink">
            <Check className="h-4 w-4 text-emeraldbrand" /> {p}
          </li>
        ))}
      </ul>
    </div>
  </section>
);
