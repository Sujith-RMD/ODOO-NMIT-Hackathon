import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { TopNav } from './TopNav';

export function AppShell() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // Basic route protection
    if (!isAuthenticated && location.pathname !== '/sign-in' && location.pathname !== '/sign-up') {
      navigate('/sign-in');
    }
  }, [isAuthenticated, location, navigate]);

  if (!isAuthenticated && (location.pathname === '/sign-in' || location.pathname === '/sign-up')) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
