'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('imagiq_user');
    const storedToken = localStorage.getItem('imagiq_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('imagiq_user');
        localStorage.removeItem('imagiq_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({ email, contrasena: password }),
      });

      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const data = await response.json();
      console.log(data)

      if (data.access_token && data.user) {
        const userData: User = {
          id: data.user.id || '1',
          email: data.user.email,
          name: data.user.nombre || 'Usuario',
          role: data.user.rol || 'Admin'
        };

        setUser(userData);
        localStorage.setItem('imagiq_user', JSON.stringify(userData));
        localStorage.setItem('imagiq_token', data.access_token);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('imagiq_user');
    localStorage.removeItem('imagiq_token');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}