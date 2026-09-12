import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const links = [
  { label: 'Transfer Planning', href: '#transfer-planning' },
  { label: 'Scholarships', href: '#scholarships' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', href: '#faq' },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2 text-berkeley">
          <GraduationCap className="h-6 w-6" />
          <span className="font-display text-lg font-bold">College Rules</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm text-ink-muted transition hover:text-brightblue">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          {user ? (
            <Link
              to="/app"
              className="rounded-full bg-berkeley px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-berkeley-deep"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-berkeley">
                Log In
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-berkeley px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-berkeley-deep"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          className="text-berkeley lg:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink/10 bg-white px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-ink-muted" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <Link to="/login" className="text-sm font-semibold text-berkeley" onClick={() => setOpen(false)}>
              Log In
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-berkeley px-5 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
