import { Outlet, Navigate } from 'react-router-dom';
import { AppNav } from './AppNav';
import { useAuth } from '@/contexts/AuthContext';

export const AppLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNav />
      <main className="flex-1 container py-6"><Outlet /></main>
    </div>
  );
};
