import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, hydrate } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Hydrate the store on mount to check if token exists in localStorage
    hydrate();
  }, [hydrate]);

  // Wait for initial hydration to complete before redirecting
  // (In a real app with loading state, you'd show a spinner here)

  if (!isAuthenticated) {
    // Redirect to the login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
