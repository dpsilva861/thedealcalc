import { Helmet } from "react-helmet-async";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { buildGlobalSchema } from "@/lib/seo/schemaBuilders";

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

/**
 * Global Layout component
 * 
 * Renders the header, footer, and injects global JSON-LD structured data
 * (Organization + WebSite) that should appear on EVERY page.
 * 
 * Page-specific schemas (SoftwareApplication, FAQPage, BreadcrumbList)
 * are handled by individual page components via their own Helmet.
 */
export function Layout({ children, showFooter = true }: LayoutProps) {
  const globalSchema = buildGlobalSchema();

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Helmet>
        {/* Global structured data: Organization + WebSite */}
        <script type="application/ld+json">
          {JSON.stringify(globalSchema)}
        </script>
      </Helmet>
      <Header />
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
