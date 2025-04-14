
import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from 'antd';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewTravel from "./pages/NewTravel";
import Participants from "./pages/Participants";
import Expenses from "./pages/Expenses";
import TravelFund from "./pages/TravelFund";
import Summary from "./pages/Summary";
import { TravelProvider } from "./context/TravelContext";
import { registerSW } from './pwa/registerSW';

// Import Ant Design styles
import 'antd/dist/reset.css';

// Define a custom theme
const theme = {
  token: {
    colorPrimary: '#9b87f5',
    borderRadius: 6,
  },
};

const queryClient = new QueryClient();

const App = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  
  // Register service worker for PWA
  useEffect(() => {
    registerSW({
      onUpdate: () => {
        setIsUpdateAvailable(true);
      }
    });
  }, []);
  
  // Handle update notification
  useEffect(() => {
    if (isUpdateAvailable) {
      // Show update notification
      const confirmUpdate = window.confirm('A new version is available. Update now?');
      
      if (confirmUpdate) {
        // Reload the page to apply the update
        window.location.reload();
      }
    }
  }, [isUpdateAvailable]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <TooltipProvider>
          <TravelProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/new-travel" element={<NewTravel />} />
                <Route path="/participants" element={<Participants />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/fund" element={<TravelFund />} />
                <Route path="/summary" element={<Summary />} />
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TravelProvider>
        </TooltipProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
