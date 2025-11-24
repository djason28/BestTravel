import React, { createContext, useContext, useState, useCallback } from 'react';

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
  const startNavigation = useCallback(() => setIsNavigating(true), []);
  const endNavigation = useCallback(() => setIsNavigating(false), []);
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