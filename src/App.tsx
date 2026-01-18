import { Suspense, lazy } from "react";
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
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Critical path - loaded eagerly for fast initial render
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Code-split routes for reduced initial bundle
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Underwrite = lazy(() => import("./pages/Underwrite"));
const Results = lazy(() => import("./pages/Results"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const BRRRR = lazy(() => import("./pages/BRRRR"));
const BRRRRResults = lazy(() => import("./pages/BRRRRResults"));
const Syndication = lazy(() => import("./pages/Syndication"));
const SyndicationResults = lazy(() => import("./pages/SyndicationResults"));

// SEO Landing Pages - lazy loaded
const RentalPropertyCalculator = lazy(() => import("./pages/RentalPropertyCalculator"));
const BRRRRCalculatorLanding = lazy(() => import("./pages/BRRRRCalculatorLanding"));
const SyndicationCalculatorLanding = lazy(() => import("./pages/SyndicationCalculatorLanding"));
const FixAndFlipCalculator = lazy(() => import("./pages/FixAndFlipCalculator"));
const CapRateCalculator = lazy(() => import("./pages/CapRateCalculator"));
const CashOnCashCalculator = lazy(() => import("./pages/CashOnCashCalculator"));
const RealEstateInvestmentCalculator = lazy(() => import("./pages/RealEstateInvestmentCalculator"));
const NPVCalculator = lazy(() => import("./pages/NPVCalculator"));
const About = lazy(() => import("./pages/About"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Contact = lazy(() => import("./pages/Contact"));
const AdTechProviders = lazy(() => import("./pages/AdTechProviders"));

// Blog pages - lazy loaded
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const BlogCategory = lazy(() => import("./pages/BlogCategory"));
const BlogSeries = lazy(() => import("./pages/BlogSeries"));
const BlogTags = lazy(() => import("./pages/BlogTags"));
const BlogTag = lazy(() => import("./pages/BlogTag"));

// Admin pages - lazy loaded (rarely accessed)
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
const AdminTaxonomy = lazy(() => import("./pages/AdminTaxonomy"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

// Minimal loading fallback - prevents layout shift
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const App = () => (
  <ErrorBoundary>
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
                  <Suspense fallback={<PageLoader />}>
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
                      <Route path="/npv-calculator" element={<NPVCalculator />} />
                      <Route path="/disclaimer" element={<Disclaimer />} />
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
                      <Route path="/admin/reset-password" element={<ResetPassword />} />
                      <Route path="/admin/blog" element={<AdminBlog />} />
                      <Route path="/admin/blog/taxonomy" element={<AdminTaxonomy />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BRRRRProvider>
              </UnderwritingProvider>
            </AdSenseLoader>
          </ConsentProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
