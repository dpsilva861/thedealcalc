import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/routing/ScrollToTop";
import { UnderwritingProvider } from "@/contexts/UnderwritingContext";
import { BRRRRProvider } from "@/contexts/BRRRRContext";
import { AdSenseLoader } from "@/components/ads/AdSenseLoader";
import { ConsentProvider } from "@/components/cmp";
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
import SyndicationResults from "./pages/SyndicationResults";
// SEO Landing Pages
import RentalPropertyCalculator from "./pages/RentalPropertyCalculator";
import BRRRRCalculatorLanding from "./pages/BRRRRCalculatorLanding";
import SyndicationCalculatorLanding from "./pages/SyndicationCalculatorLanding";
import FixAndFlipCalculator from "./pages/FixAndFlipCalculator";
import CapRateCalculator from "./pages/CapRateCalculator";
import CashOnCashCalculator from "./pages/CashOnCashCalculator";
import RealEstateInvestmentCalculator from "./pages/RealEstateInvestmentCalculator";
import Disclaimer from "./pages/Disclaimer";
import CookiePolicy from "./pages/CookiePolicy";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdTechProviders from "./pages/AdTechProviders";
// Blog pages
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import BlogCategory from "./pages/BlogCategory";
import BlogSeries from "./pages/BlogSeries";
import BlogTags from "./pages/BlogTags";
import BlogTag from "./pages/BlogTag";
import AdminBlog from "./pages/AdminBlog";
import AdminTaxonomy from "./pages/AdminTaxonomy";
import AdminLogin from "./pages/AdminLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ConsentProvider>
          <AdSenseLoader>
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
                  <Route path="/syndication/results" element={<SyndicationResults />} />
                  {/* SEO Landing Pages */}
                  <Route path="/rental-property-calculator" element={<RentalPropertyCalculator />} />
                  <Route path="/brrrr-calculator" element={<BRRRRCalculatorLanding />} />
                  <Route path="/syndication-calculator" element={<SyndicationCalculatorLanding />} />
                  <Route path="/fix-and-flip-calculator" element={<FixAndFlipCalculator />} />
                  <Route path="/cap-rate-calculator" element={<CapRateCalculator />} />
                  <Route path="/cash-on-cash-calculator" element={<CashOnCashCalculator />} />
                  <Route path="/real-estate-investment-calculator" element={<RealEstateInvestmentCalculator />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/ad-tech-providers" element={<AdTechProviders />} />
                  {/* Blog */}
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/category/:slug" element={<BlogCategory />} />
                  <Route path="/blog/series/:slug" element={<BlogSeries />} />
                  <Route path="/blog/tags" element={<BlogTags />} />
                  <Route path="/blog/tag/:tag" element={<BlogTag />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  {/* Admin */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/blog" element={<AdminBlog />} />
                  <Route path="/admin/blog/taxonomy" element={<AdminTaxonomy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BRRRRProvider>
            </UnderwritingProvider>
          </AdSenseLoader>
        </ConsentProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
