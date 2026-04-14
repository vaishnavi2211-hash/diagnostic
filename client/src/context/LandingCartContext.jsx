import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'tds_landing_cart';

const LandingCartContext = createContext(null);

export function LandingCartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, i) => n + (i.qty || 1), 0);
  const total = items.reduce((n, i) => n + (i.price || 0) * (i.qty || 1), 0);

  const value = useMemo(
    () => ({ items, addItem, removeItem, clear, count, total }),
    [items, addItem, removeItem, clear, count, total]
  );

  return <LandingCartContext.Provider value={value}>{children}</LandingCartContext.Provider>;
}

export function useLandingCart() {
  const ctx = useContext(LandingCartContext);
  if (!ctx) throw new Error('useLandingCart must be used within LandingCartProvider');
  return ctx;
}
