import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import CreatorProfileSetup from "./pages/creator/ProfileSetup";
import CreatorProfile from "./pages/creator/Profile";
import CreatorDashboard from "./pages/creator/Dashboard";
import ClientBriefSetup from "./pages/client/BriefSetup";
import ClientDiscover from "./pages/client/Discover";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Thread from "./pages/Thread";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/creator/profile-setup" element={<CreatorProfileSetup />} />
          <Route path="/creator/:userId" element={<CreatorProfile />} />
          <Route path="/creator/dashboard" element={<CreatorDashboard />} />
          <Route path="/client/brief-setup" element={<ClientBriefSetup />} />
          <Route path="/client/discover" element={<ClientDiscover />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:threadId" element={<Thread />} />
          <Route path="/chat/:matchId" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/subscription" element={<Subscription />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
