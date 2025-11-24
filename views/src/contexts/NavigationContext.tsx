import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface NavigationContextValue {
  isNavigating: boolean;
  setNavigating: (state: boolean) => void;
  startNavigation: () => void;
  endNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const setNavigating = useCallback((state: boolean) => setIsNavigating(state), []);
  // Idempotent start; record timestamp for auto-timeout safety
  const [lastStart, setLastStart] = useState<number | null>(null);
  const startNavigation = useCallback(() => {
    setIsNavigating(prev => {
      if (!prev) setLastStart(Date.now());
      return true;
    });
  }, []);
  const endNavigation = useCallback(() => { setIsNavigating(false); }, []);

  // Auto-timeout: clear navigation if it exceeds 8s (prevents stuck state)
  useEffect(() => {
    if (isNavigating) {
      const timeoutMs = Number(import.meta.env.VITE_NAV_TIMEOUT_MS || 8000);
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, timeoutMs);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, lastStart]);

  return (
    <NavigationContext.Provider value={{ isNavigating, setNavigating, startNavigation, endNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationState = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigationState must be used within NavigationProvider');
  return ctx;
};