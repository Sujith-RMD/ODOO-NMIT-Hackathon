import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    try {
      const token = localStorage.getItem('auth_token');
      const userString = localStorage.getItem('auth_user');
      if (token && userString) {
        const user = JSON.parse(userString);
        set({ token, user, isAuthenticated: true });
      }
    } catch (e) {
      console.error('Failed to hydrate auth state', e);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },
}));
