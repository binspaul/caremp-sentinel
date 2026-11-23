import apiClient from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  async login(emailAddress: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      emailAddress,
      password,
    });

    const data = response.data;
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network / token errors during logout
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },
};

export default authService;
