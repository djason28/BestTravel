import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/public/Header';
import { Footer } from '../components/public/Footer';
import { WhatsAppButton } from '../components/public/WhatsAppButton';
import { useNavigationState } from '../contexts/NavigationContext';
import { Loading } from '../components/common/Loading';

export const PublicLayout: React.FC = () => {
  const { isNavigating } = useNavigationState();
  // Main overlay (content only) when navigating
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 relative">
        <div
          className={`h-full transition-opacity duration-200 ${isNavigating ? 'opacity-40' : 'opacity-100'}`}
        >
          <Outlet />
        </div>
        {isNavigating && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <Loading size="md" />
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};
