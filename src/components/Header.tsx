
import { useState } from 'react';
import { useTravel } from '@/context/TravelContext';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Menu, 
  Home, 
  FileSpreadsheet, 
  LogOut,
  PlaneTakeoff
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const { currentTravel, travels, setCurrentTravel, exportToExcel } = useTravel();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleTravelSelect = (travelId: string) => {
    const travel = travels.find(t => t.id === travelId);
    if (travel) {
      setCurrentTravel(travel);
      toast({
        title: 'Travel loaded',
        description: `${travel.name} has been loaded.`,
      });
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleExportToExcel = () => {
    exportToExcel();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <PlaneTakeoff className="h-6 w-6 text-travel-primary" />
          <h1 
            className="text-xl font-bold cursor-pointer"
            onClick={() => navigate('/')}
          >
            Travel Splitter
          </h1>
        </div>
        
        {currentTravel && (
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {format(currentTravel.startDate, 'MMM d')} - {format(currentTravel.endDate, 'MMM d, yyyy')}
            </span>
            <h2 className="font-medium">{currentTravel.name}</h2>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {!isMobile && (
            <>
              <Button 
                variant="outline" 
                onClick={() => navigate('/new-travel')}
                className="hidden sm:flex"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Travel
              </Button>
              
              {currentTravel && (
                <Button
                  variant="outline"
                  onClick={handleExportToExcel}
                  className="hidden sm:flex"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
              
              {travels.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="hidden sm:flex">
                      My Travels
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Select Travel</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {travels.map(travel => (
                      <DropdownMenuItem
                        key={travel.id}
                        onClick={() => handleTravelSelect(travel.id)}
                        className={currentTravel?.id === travel.id ? 'bg-secondary' : ''}
                      >
                        {travel.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
          
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Travel Splitter</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigate('/')}
                >
                  <Home className="mr-2 h-5 w-5" />
                  Dashboard
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigate('/new-travel')}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  New Travel
                </Button>
                
                {currentTravel && (
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={handleExportToExcel}
                  >
                    <FileSpreadsheet className="mr-2 h-5 w-5" />
                    Export to Excel
                  </Button>
                )}
                
                {travels.length > 0 && (
                  <>
                    <div className="pt-4 pb-2 font-medium text-sm">My Travels</div>
                    {travels.map(travel => (
                      <Button
                        key={travel.id}
                        variant="ghost"
                        className={`w-full justify-start ${
                          currentTravel?.id === travel.id ? 'bg-secondary' : ''
                        }`}
                        onClick={() => handleTravelSelect(travel.id)}
                      >
                        <PlaneTakeoff className="mr-2 h-4 w-4" />
                        {travel.name}
                      </Button>
                    ))}
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
