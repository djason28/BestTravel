import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import type { User, LoginCredentials } from '../types';
import { useAppStore } from '../store/appStore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { token, user, setAuth, clearAuth, isLoadingAuth, setLoadingAuth } = useAppStore(state => ({
    token: state.token,
    user: state.user as User | null,
    setAuth: state.setAuth,
    clearAuth: state.clearAuth,
    isLoadingAuth: state.isLoadingAuth,
    setLoadingAuth: state.setLoadingAuth,
  }));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const existing = token || localStorage.getItem('auth_token');
    if (!existing) {
      setLoadingAuth(false);
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        setAuth(existing, response.data);
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuth();
    } finally {
      setLoadingAuth(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    if (response.success && response.token && response.user) {
      setAuth(response.token, response.user);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (err) { console.error('Logout error:', err); }
    clearAuth();
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoadingAuth,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
