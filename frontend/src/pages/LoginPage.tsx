import React from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LOGIN PAGE — PLACEHOLDER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * THIS FILE IS OWNED BY: [Friend's branch: employee-frontend]
 *
 * When the login page is ready on the employee-frontend branch:
 *   1. Copy this file's content with the real implementation
 *   2. The form must call authService.login({ login_id, password })
 *   3. On success, call useAuthStore.getState().setAuth(token, user)
 *   4. Then navigate to "/" (redirects to /employees automatically)
 *
 * BACKEND ENDPOINT:
 *   POST /auth/login
 *   Body: { login_id: string, password: string }
 *   Returns: { access_token: string, token_type: "bearer", user: UserResponse }
 *
 * IMPORTS NEEDED (all already installed):
 *   import { useAuthStore } from '../store/authStore';
 *   import { authService } from '../services/authService';
 *   import { useNavigate } from 'react-router-dom';
 *
 * INSTALLED DEPS AVAILABLE FOR USE:
 *   - react-hook-form  (form state)
 *   - zod + @hookform/resolvers  (validation)
 *   - framer-motion  (animations)
 * ─────────────────────────────────────────────────────────────────────────────
 */

function DevBypassButton() {
  const { login } = useAuthStore();
  return (
    <button
      onClick={() => {
        // DEV BYPASS — remove before demo, replace with real authService.login()
        login('mock-token-replace-me', {
          id: 1,
          login_id: 'OIJODO26001',
          email: 'admin@dayflow.com',
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString(),
        });
        window.location.href = '/employees';
      }}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
    >
      Dev Login (bypass)
    </button>
  );
}

export function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-3xl font-bold text-primary">Day<span className="text-foreground">flow</span></div>
        <p className="text-muted-foreground text-sm">Login page coming soon — friend's branch</p>
        {/* TEMPORARY: dev bypass — remove before demo */}
        <DevBypassButton />
      </div>
    </div>
  );
}
