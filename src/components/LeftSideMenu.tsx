
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTravel } from '@/context/TravelContext';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarFooter,
  SidebarRail,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { 
  Home, 
  PlaneTakeoff, 
  Users, 
  Receipt, 
  PiggyBank, 
  PieChart, 
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const LeftSideMenu = ({ children }: { children: React.ReactNode }) => {
  const { currentTravel, travels, setCurrentTravel, exportToExcel, exportToJSON, importFromJSON } = useTravel();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Handle file import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFromJSON(file)
        .then(success => {
          if (success) {
            navigate('/');
          }
        });
    }
  };

  // Create a hidden file input element
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle navigation
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleTravelSelect = (travelId: string) => {
    const travel = travels.find(t => t.id === travelId);
    if (travel) {
      setCurrentTravel(travel);
      toast(`${travel.name} has been loaded.`);
      navigate('/');
    }
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarRail /> {/* Adds a rail handle for resizing */}
          
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <PlaneTakeoff className="h-6 w-6 text-travel-primary" />
              <span className="text-xl font-bold">Travel Splitter</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={location.pathname === '/'} 
                      onClick={() => handleNavigate('/')}
                      tooltip="Dashboard"
                    >
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={location.pathname === '/new-travel'} 
                      onClick={() => handleNavigate('/new-travel')}
                      tooltip="New Travel"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Travel</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            {/* Travel Options - only visible when a travel is selected */}
            {currentTravel && (
              <SidebarGroup>
                <SidebarGroupLabel>{currentTravel.name}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={location.pathname === '/participants'} 
                        onClick={() => handleNavigate('/participants')}
                        tooltip="Participants"
                      >
                        <Users className="h-4 w-4" />
                        <span>Participants</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={location.pathname === '/expenses'} 
                        onClick={() => handleNavigate('/expenses')}
                        tooltip="Expenses"
                      >
                        <Receipt className="h-4 w-4" />
                        <span>Expenses</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={location.pathname === '/fund'} 
                        onClick={() => handleNavigate('/fund')}
                        tooltip="Travel Fund"
                      >
                        <PiggyBank className="h-4 w-4" />
                        <span>Travel Fund</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        isActive={location.pathname === '/summary'} 
                        onClick={() => handleNavigate('/summary')}
                        tooltip="Summary"
                      >
                        <PieChart className="h-4 w-4" />
                        <span>Summary</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* Travel Export/Import Options - ONLY VISIBLE when a travel is selected */}
            {currentTravel && (
              <SidebarGroup>
                <SidebarGroupLabel>Export/Import</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={exportToExcel}
                        tooltip="Export to Excel"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Export to Excel</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={exportToJSON}
                        tooltip="Export as JSON"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export as JSON</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={() => fileInputRef.current?.click()}
                        tooltip="Import from JSON"
                      >
                        <Upload className="h-4 w-4" />
                        <span>Import from JSON</span>
                      </SidebarMenuButton>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileUpload}
                      />
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            {/* My Travels */}
            {travels.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>My Travels</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {travels.map(travel => (
                      <SidebarMenuItem key={travel.id}>
                        <SidebarMenuButton 
                          isActive={currentTravel?.id === travel.id}
                          onClick={() => handleTravelSelect(travel.id)}
                          tooltip={travel.name}
                        >
                          <PlaneTakeoff className="h-4 w-4" />
                          <span>{travel.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
          
          <SidebarFooter>
            <div className="px-3 py-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/new-travel')}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Travel
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1">
          {/* Main content */}
          <div className="flex flex-col min-h-screen">
            <div className="flex items-center h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger />
              {currentTravel && (
                <div className="ml-4 text-sm">
                  <span className="font-medium">{currentTravel.name}</span>
                </div>
              )}
            </div>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LeftSideMenu;
