import api from './api';
import { LoginCredentials, AuthResponse, User } from '../types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<any>('/auth/login', credentials);

    // El backend devuelve 'accessToken', lo mapeamos a 'token'
    const token = response.data.accessToken;

    // Guardar token y usuario en localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    return {
      token,
      user: response.data.user,
    };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  hasRole: (role: string): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === role;
  },
};
