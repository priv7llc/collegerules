import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const PublicNav = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold text-primary">College Rules</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link to="/faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          {user ? (
            <Button asChild><Link to="/app">Dashboard</Link></Button>
          ) : (
            <>
              <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
              <Button asChild><Link to="/signup">Get Started</Link></Button>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/pricing" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Pricing</Link>
            <Link to="/faq" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>FAQ</Link>
            {user ? (
              <Button asChild><Link to="/app" onClick={() => setMobileOpen(false)}>Dashboard</Link></Button>
            ) : (
              <>
                <Button variant="ghost" asChild><Link to="/login" onClick={() => setMobileOpen(false)}>Log in</Link></Button>
                <Button asChild><Link to="/signup" onClick={() => setMobileOpen(false)}>Get Started</Link></Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
