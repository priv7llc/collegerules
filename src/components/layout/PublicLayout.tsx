import { Outlet } from 'react-router-dom';
import { PublicNav } from './PublicNav';
import { Link } from 'react-router-dom';

export const PublicLayout = () => (
  <div className="min-h-screen flex flex-col">
    <PublicNav />
    <main className="flex-1"><Outlet /></main>
    <footer className="border-t bg-card py-12">
      <div className="container grid gap-8 md:grid-cols-4">
        <div>
          <h3 className="font-display font-bold text-foreground mb-3">College Rules</h3>
          <p className="text-sm text-muted-foreground">Your personalized transfer planning dashboard. Built from official sources.</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Product</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Legal</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-3">Support</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/contact" className="hover:text-foreground">Contact Us</Link>
          </div>
        </div>
      </div>
      <div className="container mt-8 pt-8 border-t text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} College Rules. Not a replacement for official academic advising. Always verify with your counselor.</p>
      </div>
    </footer>
  </div>
);
