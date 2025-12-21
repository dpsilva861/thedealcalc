import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UnderwritingProvider } from "@/contexts/UnderwritingContext";
import { BRRRRProvider } from "@/contexts/BRRRRContext";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Account from "./pages/Account";
import Underwrite from "./pages/Underwrite";
import Results from "./pages/Results";
import SavedAnalyses from "./pages/SavedAnalyses";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import BRRRR from "./pages/BRRRR";
import BRRRRResults from "./pages/BRRRRResults";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UnderwritingProvider>
            <BRRRRProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/account" element={<Account />} />
                <Route path="/underwrite" element={<Underwrite />} />
                <Route path="/results" element={<Results />} />
                <Route path="/saved" element={<SavedAnalyses />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/brrrr" element={<BRRRR />} />
                <Route path="/brrrr/results" element={<BRRRRResults />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BRRRRProvider>
          </UnderwritingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
