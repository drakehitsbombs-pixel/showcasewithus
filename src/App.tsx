import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Discover from "./pages/Discover";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import CreatorProfileSetup from "./pages/creator/ProfileSetup";
import CreatorProfile from "./pages/creator/Profile";
import CreatorDashboard from "./pages/creator/Dashboard";
import CreatorCalendar from "./pages/creator/Calendar";
import ClientBriefSetup from "./pages/client/BriefSetup";
import ClientDiscover from "./pages/client/Discover";
import ClientProfileEdit from "./pages/client/ProfileEdit";
import ClientProfile from "./pages/client/Profile";
import ClientShowcase from "./pages/client/Showcase";
import PublicProfile from "./pages/PublicProfile";
import Surfing from "./pages/Surfing";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Thread from "./pages/Thread";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Subscription from "./pages/Subscription";
import Me from "./pages/Me";
import MeEdit from "./pages/MeEdit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/creator/profile-setup" element={<CreatorProfileSetup />} />
          <Route path="/creator/:username" element={<CreatorProfile />} />
          <Route path="/creator/id/:userId" element={<CreatorProfile />} />
          <Route path="/creator/dashboard" element={<CreatorDashboard />} />
          <Route path="/creator/calendar" element={<CreatorCalendar />} />
          <Route path="/client/brief-setup" element={<ClientBriefSetup />} />
          <Route path="/client/profile/edit" element={<ClientProfileEdit />} />
          <Route path="/client/profile" element={<ClientProfile />} />
          <Route path="/client/discover" element={<ClientDiscover />} />
          <Route path="/client/showcase" element={<ClientShowcase />} />
          <Route path="/p/:slug" element={<PublicProfile />} />
          <Route path="/surfing" element={<Navigate to="/client/discover?tab=search&styles=surfing" replace />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:threadId" element={<Thread />} />
          <Route path="/chat/:matchId" element={<Chat />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/me" element={<Me />} />
          <Route path="/me/edit" element={<MeEdit />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
