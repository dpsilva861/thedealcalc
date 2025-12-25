import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UnderwritingProvider } from "@/contexts/UnderwritingContext";
import { BRRRRProvider } from "@/contexts/BRRRRContext";
import Index from "./pages/Index";
import HowItWorks from "./pages/HowItWorks";
import Underwrite from "./pages/Underwrite";
import Results from "./pages/Results";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import BRRRR from "./pages/BRRRR";
import BRRRRResults from "./pages/BRRRRResults";
import Syndication from "./pages/Syndication";
// SEO Landing Pages
import RentalPropertyCalculator from "./pages/RentalPropertyCalculator";
import BRRRRCalculatorLanding from "./pages/BRRRRCalculatorLanding";
import FixAndFlipCalculator from "./pages/FixAndFlipCalculator";
import CapRateCalculator from "./pages/CapRateCalculator";
import CashOnCashCalculator from "./pages/CashOnCashCalculator";
import RealEstateInvestmentCalculator from "./pages/RealEstateInvestmentCalculator";
import Disclaimer from "./pages/Disclaimer";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UnderwritingProvider>
          <BRRRRProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/underwrite" element={<Underwrite />} />
              <Route path="/results" element={<Results />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/brrrr" element={<BRRRR />} />
              <Route path="/brrrr/results" element={<BRRRRResults />} />
              <Route path="/syndication" element={<Syndication />} />
              {/* SEO Landing Pages */}
              <Route path="/rental-property-calculator" element={<RentalPropertyCalculator />} />
              <Route path="/brrrr-calculator" element={<BRRRRCalculatorLanding />} />
              <Route path="/fix-and-flip-calculator" element={<FixAndFlipCalculator />} />
              <Route path="/cap-rate-calculator" element={<CapRateCalculator />} />
              <Route path="/cash-on-cash-calculator" element={<CashOnCashCalculator />} />
              <Route path="/real-estate-investment-calculator" element={<RealEstateInvestmentCalculator />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BRRRRProvider>
        </UnderwritingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
