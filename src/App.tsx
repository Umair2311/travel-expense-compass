
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewTravel from "./pages/NewTravel";
import Participants from "./pages/Participants";
import Expenses from "./pages/Expenses";
import TravelFund from "./pages/TravelFund";
import Summary from "./pages/Summary";
import { TravelProvider } from "./context/TravelContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;
