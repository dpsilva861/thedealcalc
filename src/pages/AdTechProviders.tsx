import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Shield, Search, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Google AdSense Ad Technology Providers
 * 
 * This list is based on Google's commonly used ad technology providers.
 * Publishers should update this list based on their actual AdSense configuration.
 * 
 * To find your actual vendor list:
 * 1. Go to AdSense → Privacy & messaging → GDPR → Manage
 * 2. View your "Ad technology providers" list
 * 3. Update this list accordingly
 * 
 * Reference: https://support.google.com/adsense/answer/9012903
 */
const adTechProviders = [
  {
    name: "Google LLC",
    privacyUrl: "https://policies.google.com/privacy",
    category: "Advertising Platform",
  },
  {
    name: "Google Advertising Products",
    privacyUrl: "https://policies.google.com/technologies/ads",
    category: "Advertising",
  },
  {
    name: "DoubleClick (Google)",
    privacyUrl: "https://policies.google.com/privacy",
    category: "Advertising",
  },
  {
    name: "Google AdSense",
    privacyUrl: "https://policies.google.com/technologies/partner-sites",
    category: "Advertising",
  },
  {
    name: "Google Analytics",
    privacyUrl: "https://policies.google.com/privacy",
    category: "Analytics",
  },
  {
    name: "Google Tag Manager",
    privacyUrl: "https://policies.google.com/privacy",
    category: "Tag Management",
  },
  {
    name: "Google Funding Choices",
    privacyUrl: "https://policies.google.com/privacy",
    category: "Consent Management",
  },
  // Additional common ad tech providers that may be used
  {
    name: "Criteo",
    privacyUrl: "https://www.criteo.com/privacy/",
    category: "Advertising",
  },
  {
    name: "The Trade Desk",
    privacyUrl: "https://www.thetradedesk.com/general/privacy",
    category: "Advertising",
  },
  {
    name: "Rubicon Project (Magnite)",
    privacyUrl: "https://www.magnite.com/legal/advertising-platform-privacy-policy/",
    category: "Advertising",
  },
  {
    name: "Index Exchange",
    privacyUrl: "https://www.indexexchange.com/privacy/",
    category: "Advertising",
  },
  {
    name: "OpenX",
    privacyUrl: "https://www.openx.com/legal/privacy-policy/",
    category: "Advertising",
  },
  {
    name: "PubMatic",
    privacyUrl: "https://pubmatic.com/legal/privacy/",
    category: "Advertising",
  },
  {
    name: "AppNexus (Xandr)",
    privacyUrl: "https://www.xandr.com/privacy/platform-privacy-policy/",
    category: "Advertising",
  },
  {
    name: "Amazon Advertising",
    privacyUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ",
    category: "Advertising",
  },
  {
    name: "Taboola",
    privacyUrl: "https://www.taboola.com/policies/privacy-policy",
    category: "Native Advertising",
  },
  {
    name: "Outbrain",
    privacyUrl: "https://www.outbrain.com/legal/privacy",
    category: "Native Advertising",
  },
  {
    name: "MediaMath",
    privacyUrl: "https://www.mediamath.com/privacy-policy/",
    category: "Advertising",
  },
  {
    name: "Sizmek",
    privacyUrl: "https://www.sizmek.com/privacy-policy/",
    category: "Ad Serving",
  },
  {
    name: "Quantcast",
    privacyUrl: "https://www.quantcast.com/privacy/",
    category: "Advertising/Measurement",
  },
  {
    name: "Comscore",
    privacyUrl: "https://www.comscore.com/About/Privacy-Policy",
    category: "Measurement",
  },
  {
    name: "Nielsen",
    privacyUrl: "https://www.nielsen.com/legal/privacy-principles/",
    category: "Measurement",
  },
  {
    name: "LiveRamp",
    privacyUrl: "https://liveramp.com/privacy/",
    category: "Data Partner",
  },
  {
    name: "Oracle Data Cloud",
    privacyUrl: "https://www.oracle.com/legal/privacy/advertising-privacy-policy.html",
    category: "Data Partner",
  },
  {
    name: "Lotame",
    privacyUrl: "https://www.lotame.com/about-lotame/privacy/",
    category: "Data Partner",
  },
  {
    name: "Integral Ad Science",
    privacyUrl: "https://integralads.com/privacy-policy/",
    category: "Verification",
  },
  {
    name: "DoubleVerify",
    privacyUrl: "https://doubleverify.com/privacy/",
    category: "Verification",
  },
  {
    name: "MOAT (Oracle)",
    privacyUrl: "https://www.oracle.com/legal/privacy/advertising-privacy-policy.html",
    category: "Verification",
  },
].sort((a, b) => a.name.localeCompare(b.name));

export default function AdTechProviders() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return adTechProviders;
    const query = searchQuery.toLowerCase();
    return adTechProviders.filter(
      (provider) =>
        provider.name.toLowerCase().includes(query) ||
        provider.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://thedealcalc.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Privacy Policy",
        item: "https://thedealcalc.com/privacy",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Ad Technology Providers",
        item: "https://thedealcalc.com/ad-tech-providers",
      },
    ],
  };

  return (
    <Layout>
      <Helmet>
        <title>Ad Technology Providers | TheDealCalc</title>
        <meta
          name="description"
          content="List of ad technology providers and their privacy policies used by TheDealCalc for serving advertisements through Google AdSense."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://thedealcalc.com/ad-tech-providers" />
        <meta property="og:title" content="Ad Technology Providers | TheDealCalc" />
        <meta
          property="og:description"
          content="View the list of ad technology providers used by TheDealCalc and their privacy policies."
        />
        <meta property="og:url" content="https://thedealcalc.com/ad-tech-providers" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Ad Technology Providers
          </h1>
        </div>

        <p className="text-muted-foreground mb-6 max-w-3xl">
          TheDealCalc uses Google AdSense to display advertisements. The following
          ad technology providers may collect and use data to serve personalized
          advertisements. Each provider has their own privacy policy governing how
          they handle your data.
        </p>

        <div className="bg-card border border-border rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-foreground mb-2">Your Choices</h2>
          <p className="text-muted-foreground text-sm mb-3">
            You can manage your preferences for personalized advertising:
          </p>
          <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
            <li>
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Ads Settings
              </a>{" "}
              — Opt out of personalized ads from Google
            </li>
            <li>
              <a
                href="https://optout.aboutads.info/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                DAA Opt-Out
              </a>{" "}
              — Opt out of interest-based advertising from DAA members
            </li>
            <li>
              <a
                href="https://www.youronlinechoices.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Your Online Choices (EU)
              </a>{" "}
              — European advertising opt-out
            </li>
            <li>
              <a
                href="https://optout.networkadvertising.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                NAI Opt-Out
              </a>{" "}
              — Opt out from NAI member companies
            </li>
          </ul>
        </div>

        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Ad Technology Providers</span>
        </nav>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Provider Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Ad Technology Provider</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead>Privacy Policy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.name}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {provider.category}
                  </TableCell>
                  <TableCell>
                    <a
                      href={provider.privacyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      View Privacy Policy
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProviders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No providers found matching "{searchQuery}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-muted-foreground text-sm mt-6">
          <strong>Note:</strong> This list includes common ad technology providers
          that may be used through Google AdSense. The actual providers serving ads
          on this site may vary based on your location, browsing history, and other
          factors. For the most accurate information, please refer to{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google's partner sites policy
          </a>
          .
        </p>

        <div className="mt-8 pt-6 border-t border-border">
          <h2 className="font-semibold text-foreground mb-3">Related Policies</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              — How we handle your personal information
            </li>
            <li>
              <Link to="/cookies" className="text-primary hover:underline">
                Cookie Policy
              </Link>{" "}
              — How we use cookies and tracking technologies
            </li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
