import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowRight } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const popularPages = [
    { name: "Rental Property Calculator", path: "/underwrite" },
    { name: "BRRRR Calculator", path: "/brrrr" },
    { name: "Syndication Analyzer", path: "/syndication" },
    { name: "All Calculators", path: "/calculators" },
    { name: "Blog", path: "/blog" },
  ];

  return (
    <Layout>
      <Helmet>
        <title>Page Not Found | TheDealCalc</title>
        <meta name="description" content="The page you're looking for doesn't exist. Browse our free real estate investment calculators instead." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://thedealcalc.com/" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-lg mx-auto">
          <div className="text-8xl font-display font-bold text-primary/20 mb-4">404</div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
            Let's get you back on track.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/calculators">
                <Search className="h-4 w-4 mr-2" />
                Browse Calculators
              </Link>
            </Button>
          </div>

          <div className="text-left bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold text-foreground mb-4">Popular Pages</h2>
            <ul className="space-y-2">
              {popularPages.map((page) => (
                <li key={page.path}>
                  <Link 
                    to={page.path} 
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="h-4 w-4" />
                    {page.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
