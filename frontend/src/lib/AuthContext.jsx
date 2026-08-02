import { createContext, useContext, useEffect, useState } from 'react';
import { api, getTokens, setTokens, clearTokens } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('medimate_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { accessToken } = getTokens();
    if (!accessToken) setUser(null);
    setLoading(false);
  }, []);

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password }, { skipAuth: true });
    setTokens(data);
    localStorage.setItem('medimate_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(fields) {
    const data = await api.post('/auth/register', fields, { skipAuth: true });
    setTokens(data);
    localStorage.setItem('medimate_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken }, { skipAuth: true });
      } catch {
      }
    }
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
