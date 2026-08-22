import { api } from './api';
import { LoginRequest, LoginResponse, SignUpRequest, ChangePasswordRequest } from '../types';

// Mock data fallbacks for when the backend routes aren't ready
const MOCK_USER = {
  id: 1,
  login_id: 'OIDO20240001',
  email: 'admin@company.com',
  role: 'admin' as const,
  is_active: true,
  created_at: new Date().toISOString(),
};

const MOCK_LOGIN_RESPONSE: LoginResponse = {
  access_token: 'mock-jwt-token-12345',
  token_type: 'bearer',
  user: MOCK_USER,
};

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', data);
      return response.data;
    } catch (error) {
      console.warn('Backend login failed, using mock data for demo.', error);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (data.login_id && data.password) {
        return MOCK_LOGIN_RESPONSE;
      }
      throw new Error('Invalid credentials');
    }
  },

  signup: async (data: SignUpRequest): Promise<{ message: string }> => {
    try {
      // Create FormData if there's a logo
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value as string | Blob);
        }
      });
      const response = await api.post('/auth/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.warn('Backend signup failed, using mock fallback.', error);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { message: 'Company account created successfully (mock).' };
    }
  },

  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/change-password', data);
      return response.data;
    } catch (error) {
      console.warn('Backend change-password failed, using mock fallback.', error);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { message: 'Password changed successfully (mock).' };
    }
  },
};
