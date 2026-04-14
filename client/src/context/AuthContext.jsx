import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLab(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api('/auth/me');
      setUser(data.user);
      setLab(data.lab || null);
    } catch {
      setToken(null);
      setUser(null);
      setLab(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const token = getToken();
    if (!token || !user) return undefined;
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const s = io(API_BASE || '/', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    s.on('notification', (payload) => {
      setNotifications((prev) => [{ ...payload, _id: crypto.randomUUID() }, ...prev].slice(0, 50));
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    await refresh();
    return data.user;
  }, [refresh]);

  const register = useCallback(async (payload) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(data.token);
    setUser(data.user);
    await refresh();
    return data.user;
  }, [refresh]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setLab(null);
    setNotifications([]);
    setSocket((s) => {
      s?.disconnect();
      return null;
    });
  }, []);

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const value = useMemo(
    () => ({
      user,
      lab,
      loading,
      login,
      register,
      logout,
      refresh,
      socket,
      notifications,
      dismissNotification,
    }),
    [user, lab, loading, login, register, logout, refresh, socket, notifications]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
