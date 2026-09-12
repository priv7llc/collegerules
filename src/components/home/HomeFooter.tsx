import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export const HomeFooter = () => (
  <footer className="border-t border-ink/10 bg-offwhite">
    <div className="mx-auto grid max-w-[1240px] gap-10 px-6 py-14 md:grid-cols-4">
      <div>
        <div className="flex items-center gap-2 text-berkeley">
          <GraduationCap className="h-6 w-6" />
          <span className="font-display text-lg font-bold">College Rules</span>
        </div>
        <p className="mt-3 max-w-xs text-sm text-ink-muted">
          Personalized transfer planning, scholarship matching and affordability tools for community college students.
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-berkeley">Product</h3>
        <div className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
          <a href="#transfer-planning" className="hover:text-brightblue">Transfer Planning</a>
          <a href="#scholarships" className="hover:text-brightblue">Scholarships</a>
          <Link to="/pricing" className="hover:text-brightblue">Pricing</Link>
          <Link to="/faq" className="hover:text-brightblue">FAQ</Link>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-berkeley">Legal</h3>
        <div className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
          <Link to="/terms" className="hover:text-brightblue">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-brightblue">Privacy Policy</Link>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-berkeley">Support</h3>
        <div className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
          <Link to="/contact" className="hover:text-brightblue">Contact Us</Link>
          <Link to="/login" className="hover:text-brightblue">Log In</Link>
          <Link to="/signup" className="hover:text-brightblue">Create Account</Link>
        </div>
      </div>
    </div>
    <div className="mx-auto max-w-[1240px] border-t border-ink/10 px-6 py-6 text-center text-xs text-ink-muted">
      © {new Date().getFullYear()} College Rules. Not a replacement for official academic advising. Always verify with
      your counselor.
    </div>
  </footer>
);
