
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ReceiptText, 
  Users, 
  PiggyBank, 
  BarChart3, 
  FileSpreadsheet, 
  Home 
} from 'lucide-react';
import { useTravel } from '@/context/TravelContext';
import { useIsMobile } from '@/hooks/use-mobile';

const ActionBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentTravel, exportToExcel } = useTravel();
  const isMobile = useIsMobile();
  
  if (!currentTravel) return null;
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:relative md:border-t-0 md:mb-6">
      <div className="container mx-auto py-2 md:py-0">
        <div className="flex justify-between md:justify-start md:space-x-4">
          <Button
            variant={isActive('/') ? "default" : "ghost"}
            size={isMobile ? "icon" : "default"}
            onClick={() => navigate('/')}
            className="flex-1 md:flex-none"
          >
            <Home className={`h-5 w-5 ${!isMobile && 'mr-2'}`} />
            {!isMobile && <span>Dashboard</span>}
          </Button>
          
          <Button
            variant={isActive('/expenses') ? "default" : "ghost"}
            size={isMobile ? "icon" : "default"}
            onClick={() => navigate('/expenses')}
            className="flex-1 md:flex-none"
          >
            <ReceiptText className={`h-5 w-5 ${!isMobile && 'mr-2'}`} />
            {!isMobile && <span>Expenses</span>}
          </Button>
          
          <Button
            variant={isActive('/participants') ? "default" : "ghost"}
            size={isMobile ? "icon" : "default"}
            onClick={() => navigate('/participants')}
            className="flex-1 md:flex-none"
          >
            <Users className={`h-5 w-5 ${!isMobile && 'mr-2'}`} />
            {!isMobile && <span>Participants</span>}
          </Button>
          
          <Button
            variant={isActive('/fund') ? "default" : "ghost"}
            size={isMobile ? "icon" : "default"}
            onClick={() => navigate('/fund')}
            className="flex-1 md:flex-none"
          >
            <PiggyBank className={`h-5 w-5 ${!isMobile && 'mr-2'}`} />
            {!isMobile && <span>Travel Fund</span>}
          </Button>
          
          <Button
            variant={isActive('/summary') ? "default" : "ghost"}
            size={isMobile ? "icon" : "default"}
            onClick={() => navigate('/summary')}
            className="flex-1 md:flex-none"
          >
            <BarChart3 className={`h-5 w-5 ${!isMobile && 'mr-2'}`} />
            {!isMobile && <span>Summary</span>}
          </Button>
          
          {!isMobile && (
            <Button
              variant="outline"
              onClick={exportToExcel}
            >
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Export
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
