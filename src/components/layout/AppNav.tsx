import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Route, PlusCircle, User, HelpCircle, LogOut, Shield } from 'lucide-react';

export const AppNav = () => {
  const { signOut, userRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { to: '/app', icon: Route, label: 'My Routes', exact: true },
    { to: '/app/create', icon: PlusCircle, label: 'Create Route' },
    { to: '/app/account', icon: User, label: 'Account' },
    { to: '/app/support', icon: HelpCircle, label: 'Support' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/app" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-display text-lg font-bold">College Rules</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navItems.map(item => (
            <Button
              key={item.to}
              variant="ghost"
              size="sm"
              asChild
              className={`text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ${
                (item.exact ? location.pathname === item.to : isActive(item.to)) ? 'bg-primary-foreground/15 text-primary-foreground' : ''
              }`}
            >
              <Link to={item.to}>
                <item.icon className="h-4 w-4 mr-1" />
                {item.label}
              </Link>
            </Button>
          ))}
          {userRole === 'admin' && (
            <Button variant="ghost" size="sm" asChild className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/admin"><Shield className="h-4 w-4 mr-1" />Admin</Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4 mr-1" />Log out
          </Button>
        </div>
      </div>
    </nav>
  );
};
