import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import User from "./pages/User";
import Group from "./pages/Group";
import Dataset from "./pages/Dataset";
import Resource from "./pages/Resource";
import AccessCheck from "./pages/AccessCheck";
import Settings from "./pages/Settings";
import Certificates from "./pages/Certificates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />}>
            <Route index element={<User />} />
            <Route path="user" element={<User />} />
            <Route path="group" element={<Group />} />
            <Route path="dataset" element={<Dataset />} />
            <Route path="resource" element={<Resource />} />
            <Route path="access-check" element={<AccessCheck />} />
            <Route path="settings" element={<Settings />} />
            <Route path="certificates" element={<Certificates />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
