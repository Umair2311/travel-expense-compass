
import React, { useState } from 'react';
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
  LogOut,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const LeftSideMenu = ({ children }: { children: React.ReactNode }) => {
  const { currentTravel, travels, setCurrentTravel, exportToExcel, exportToJSON, importFromJSON, deleteTravel } = useTravel();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTravelForDelete, setSelectedTravelForDelete] = useState<string | null>(null);

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

  // Handle delete trip actions
  const openDeleteDialog = (travelId: string) => {
    setSelectedTravelForDelete(travelId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTravelForDelete) {
      const travel = travels.find(t => t.id === selectedTravelForDelete);
      deleteTravel(selectedTravelForDelete);
      setDeleteDialogOpen(false);
      setSelectedTravelForDelete(null);
      setCurrentTravel(null);
      navigate('/');
      toast.success(`Trip "${travel?.name ?? ''}" deleted successfully`);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedTravelForDelete(null);
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        <Sidebar className="bg-background border-r">
          <SidebarRail className="bg-background" /> {/* Add background to rail */}
          
          <SidebarHeader className="bg-background">
            <div className="flex items-center gap-2 px-4 py-2">
              <PlaneTakeoff className="h-6 w-6 text-travel-primary" />
              <span className="text-xl font-bold">Travel Splitter</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="bg-background">
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
                  
                  {/* Import from JSON - ALWAYS VISIBLE */}
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
            
            {/* Travel Export Options - ONLY VISIBLE when a travel is selected */}
            {currentTravel && (
              <SidebarGroup>
                <SidebarGroupLabel>Export Options</SidebarGroupLabel>
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
                        <div className="flex items-center justify-between w-full">
                          <SidebarMenuButton 
                            isActive={currentTravel?.id === travel.id}
                            onClick={() => handleTravelSelect(travel.id)}
                            tooltip={travel.name}
                          >
                            <PlaneTakeoff className="h-4 w-4" />
                            <span>{travel.name}</span>
                          </SidebarMenuButton>
                          <AlertDialog open={deleteDialogOpen && selectedTravelForDelete === travel.id} onOpenChange={(open) => { if (!open) handleCancelDelete(); }}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                className="ml-1 px-2 py-1 h-7 w-7"
                                title="Delete Trip"
                                onClick={e => { e.stopPropagation(); openDeleteDialog(travel.id); }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to delete "{travel.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. All participants, expenses, and data for this trip will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={handleCancelDelete}>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/80" onClick={handleConfirmDelete}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
          
          <SidebarFooter className="bg-background">
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

