import { BarChart3, BookOpen, GraduationCap } from 'lucide-react';
import { Reveal } from './Reveal';

const items = [
  {
    icon: BookOpen,
    tone: 'bg-softblue text-brightblue',
    title: 'Transfer Planning',
    desc: 'Know exactly what courses to take.',
  },
  {
    icon: GraduationCap,
    tone: 'bg-emeraldbrand/10 text-emeraldbrand',
    title: 'Scholarships',
    desc: 'Discover opportunities matched to you.',
  },
  {
    icon: BarChart3,
    tone: 'bg-berkeley-soft text-berkeley',
    title: 'Affordability',
    desc: 'See what college could actually cost.',
  },
];

export const PlatformFeatures = () => (
  <section className="bg-white">
    <div className="mx-auto max-w-[1240px] px-6 py-20 lg:py-28">
      <Reveal>
        <h2
          className="text-center font-display font-bold text-berkeley"
          style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)' }}
        >
          One platform. Your entire transfer journey.
        </h2>
      </Reveal>
      <div className="mt-14 grid gap-10 md:grid-cols-3">
        {items.map((i) => (
          <Reveal key={i.title} className="text-center">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${i.tone}`}>
              <i.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-berkeley">{i.title}</h3>
            <p className="mt-2 text-ink-muted">{i.desc}</p>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
