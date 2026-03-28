import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, LayoutDashboard, Users, CreditCard, Route, Database, FileText, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/purchases', icon: CreditCard, label: 'Purchases' },
  { to: '/admin/routes', icon: Route, label: 'Routes' },
  { to: '/admin/sources', icon: Database, label: 'Sources' },
  { to: '/admin/audit', icon: FileText, label: 'Audit Log' },
];

export const AdminLayout = () => {
  const { user, loading, userRole, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (userRole !== 'admin') return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-4 border-b border-primary-foreground/10">
          <Link to="/admin" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <span className="font-display font-bold">Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map(item => {
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to) && item.to !== '/admin';
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active ? 'bg-primary-foreground/15 text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-primary-foreground/10 space-y-1">
          <Link to="/app" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-4 w-4" />Back to App
          </Link>
          <button onClick={() => signOut()} className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4" />Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-background overflow-auto">
        <div className="p-6"><Outlet /></div>
      </main>
    </div>
  );
};
