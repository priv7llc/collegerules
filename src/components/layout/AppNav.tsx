import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Route, PlusCircle, User, HelpCircle, LogOut, Shield, Menu, CreditCard, Award } from 'lucide-react';

export const AppNav = () => {
  const { signOut, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { to: '/app', icon: Route, label: 'My Routes', exact: true },
    { to: '/app/create', icon: PlusCircle, label: 'Create Route' },
    { to: '/app/account', icon: User, label: 'Account' },
    { to: '/app/support', icon: HelpCircle, label: 'Support' },
    { to: '/app/buy-credits', icon: CreditCard, label: 'Buy Credits' },
  ];

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map(item => (
        <Button
          key={item.to}
          variant="ghost"
          size={mobile ? 'default' : 'sm'}
          asChild
          className={`${mobile ? 'w-full justify-start text-foreground hover:bg-muted' : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'} ${
            (item.exact ? location.pathname === item.to : isActive(item.to)) ? (mobile ? 'bg-muted font-medium' : 'bg-primary-foreground/15 text-primary-foreground') : ''
          }`}
          onClick={() => mobile && setOpen(false)}
        >
          <Link to={item.to}>
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </Link>
        </Button>
      ))}
      {userRole === 'admin' && (
        <Button
          variant="ghost"
          size={mobile ? 'default' : 'sm'}
          asChild
          className={mobile ? 'w-full justify-start text-foreground hover:bg-muted' : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'}
          onClick={() => mobile && setOpen(false)}
        >
          <Link to="/admin"><Shield className="h-4 w-4 mr-2" />Admin</Link>
        </Button>
      )}
      <Button
        variant="ghost"
        size={mobile ? 'default' : 'sm'}
        onClick={handleSignOut}
        className={mobile ? 'w-full justify-start text-foreground hover:bg-muted' : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10'}
      >
        <LogOut className="h-4 w-4 mr-2" />Log out
      </Button>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/app" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-display text-lg font-bold">College Rules</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLinks />
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-4">
            <div className="flex flex-col gap-1 mt-6">
              <NavLinks mobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
