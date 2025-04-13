
import React from 'react';
import Header from './Header';
import ActionBar from './ActionBar';
import { useTravel } from '@/context/TravelContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentTravel } = useTravel();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 container mx-auto py-6 px-4 ${isMobile && currentTravel ? 'pb-20' : ''}`}>
        {children}
      </main>
      {currentTravel && <ActionBar />}
    </div>
  );
};

export default Layout;
