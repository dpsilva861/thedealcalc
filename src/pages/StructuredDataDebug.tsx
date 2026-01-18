// src/pages/StructuredDataDebug.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

type JsonRecord = Record<string, unknown>;

interface ValidationResult {
  field: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

interface SchemaValidation {
  type: string;
  valid: boolean;
  results: ValidationResult[];
  raw: unknown;
}

type SourceKind = "dom" | "fetch";

function validateBreadcrumbList(schema: JsonRecord): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (schema["@type"] === "BreadcrumbList") {
    results.push({ field: "@type", status: "pass", message: "BreadcrumbList" });
  } else {
    results.push({
      field: "@type",
      status: "fail",
      message: `Expected BreadcrumbList, got ${String(schema["@type"])}`,
    });
  }

  const items = schema.itemListElement;
  if (!items) {
    results.push({ field: "itemListElement", status: "fail", message: "Missing itemListElement" });
    return results;
  }
  if (!Array.isArray(items)) {
    results.push({ field: "itemListElement", status: "fail", message: "itemListElement must be an array" });
    return results;
  }

  results.push({ field: "itemListElement", status: "pass", message: `Array with ${items.length} items` });

  let lastPosition = 0;
  let positionsValid = true;

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as JsonRecord;
    const position = item.position as number;

    if (typeof position !== "number") {
      results.push({ field: `item[${i}].position`, status: "fail", message: "Position must be a number" });
      positionsValid = false;
    } else if (position !== lastPosition + 1) {
      results.push({
        field: `item[${i}].position`,
        status: "fail",
        message: `Position ${position} not sequential (expected ${lastPosition + 1})`,
      });
      positionsValid = false;
    } else {
      lastPosition = position;
    }

    if (!item.name) {
      results.push({ field: `item[${i}].name`, status: "fail", message: "Missing name" });
    }
    if (!item.item) {
      results.push({ field: `item[${i}].item`, status: "fail", message: "Missing item URL" });
    }
  }

  if (items.length > 0 && positionsValid) {
    results.push({ field: "positions", status: "pass", message: `Sequential: 1 to ${lastPosition}` });
  }

  return results;
}

function validateSoftwareApplication(schema: JsonRecord): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (schema["@type"] === "SoftwareApplication") {
    results.push({ field: "@type", status: "pass", message: "SoftwareApplication" });
  } else {
    results.push({
      field: "@type",
      status: "fail",
      message: `Expected SoftwareApplication, got ${String(schema["@type"])}`,
    });
  }

  const requiredFields = ["name", "applicationCategory", "operatingSystem", "url"] as const;
  for (const field of requiredFields) {
    if (schema[field]) results.push({ field, status: "pass", message: String(schema[field]).slice(0, 60) });
    else results.push({ field, status: "fail", message: `Missing ${field}` });
  }

  const offers = schema.offers as JsonRecord | undefined;
  if (offers && offers.price !== undefined) {
    results.push({ field: "offers.price", status: "pass", message: String(offers.price) });
  } else if (schema.price !== undefined) {
    results.push({ field: "price", status: "pass", message: String(schema.price) });
  } else {
    results.push({ field: "price/offers", status: "warn", message: "No price or offers specified" });
  }

  return results;
}

function validateFAQPage(schema: JsonRecord): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (schema["@type"] === "FAQPage") results.push({ field: "@type", status: "pass", message: "FAQPage" });
  else
    results.push({
      field: "@type",
      status: "fail",
      message: `Expected FAQPage, got ${String(schema["@type"])}`,
    });

  const mainEntity = schema.mainEntity;
  if (!mainEntity) {
    results.push({ field: "mainEntity", status: "fail", message: "Missing mainEntity" });
    return results;
  }
  if (!Array.isArray(mainEntity)) {
    results.push({ field: "mainEntity", status: "fail", message: "mainEntity must be an array" });
    return results;
  }

  results.push({ field: "mainEntity", status: "pass", message: `${mainEntity.length} questions` });

  let questionsValid = true;
  for (let i = 0; i < Math.min(mainEntity.length, 3); i++) {
    const q = mainEntity[i] as JsonRecord;

    if (q["@type"] !== "Question") {
      results.push({ field: `Q${i + 1}.@type`, status: "fail", message: "Expected Question" });
      questionsValid = false;
    }
    if (!q.name) {
      results.push({ field: `Q${i + 1}.name`, status: "fail", message: "Missing name" });
      questionsValid = false;
    }

    const answer = q.acceptedAnswer as JsonRecord | undefined;
    if (!answer || !answer.text) {
      results.push({ field: `Q${i + 1}.acceptedAnswer`, status: "fail", message: "Missing answer text" });
      questionsValid = false;
    }
  }

  if (mainEntity.length > 3) results.push({ field: "remaining", status: "pass", message: `+${mainEntity.length - 3} more questions` });
  if (questionsValid && mainEntity.length > 0) results.push({ field: "structure", status: "pass", message: "All questions valid" });

  return results;
}

function validateArticle(schema: JsonRecord): ValidationResult[] {
  const results: ValidationResult[] = [];
  const validTypes = ["Article", "BlogPosting", "NewsArticle"];
  const schemaType = String(schema["@type"]);

  if (validTypes.includes(schemaType)) results.push({ field: "@type", status: "pass", message: schemaType });
  else results.push({ field: "@type", status: "fail", message: `Expected Article/BlogPosting, got ${schemaType}` });

  const requiredFields = ["headline", "datePublished", "author", "image", "mainEntityOfPage", "url"] as const;
  for (const field of requiredFields) {
    if (schema[field]) {
      const value = typeof schema[field] === "object" ? JSON.stringify(schema[field]).slice(0, 40) + "..." : String(schema[field]).slice(0, 40);
      results.push({ field, status: "pass", message: value });
    } else {
      results.push({ field, status: "fail", message: `Missing ${field}` });
    }
  }

  if (schema.dateModified) results.push({ field: "dateModified", status: "pass", message: String(schema.dateModified) });
  else results.push({ field: "dateModified", status: "warn", message: "Not specified (recommended)" });

  return results;
}

function validateWebPage(schema: JsonRecord): ValidationResult[] {
  const results: ValidationResult[] = [{ field: "@type", status: "pass", message: "WebPage" }];
  if (schema.name) results.push({ field: "name", status: "pass", message: String(schema.name).slice(0, 50) });
  if (schema.url) results.push({ field: "url", status: "pass", message: String(schema.url) });
  return results;
}

function validateSchema(schema: JsonRecord): SchemaValidation {
  const type = String(schema["@type"] || "Unknown");
  let results: ValidationResult[] = [];

  switch (type) {
    case "BreadcrumbList":
      results = validateBreadcrumbList(schema);
      break;
    case "SoftwareApplication":
      results = validateSoftwareApplication(schema);
      break;
    case "FAQPage":
      results = validateFAQPage(schema);
      break;
    case "Article":
    case "BlogPosting":
    case "NewsArticle":
      results = validateArticle(schema);
      break;
    case "WebPage":
      results = validateWebPage(schema);
      break;
    default:
      results = [{ field: "@type", status: "warn", message: `Unknown schema type: ${type}` }];
  }

  return { type, valid: results.every((r) => r.status !== "fail"), results, raw: schema };
}

function extractSchemasFromDOM(): SchemaValidation[] {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  const validations: SchemaValidation[] = [];

  scripts.forEach((script) => {
    const content = script.textContent || "";
    try {
      const parsed = JSON.parse(content);
      if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
        for (const schema of parsed["@graph"]) validations.push(validateSchema(schema as JsonRecord));
      } else {
        validations.push(validateSchema(parsed as JsonRecord));
      }
    } catch (e) {
      validations.push({
        type: "Parse Error",
        valid: false,
        results: [{ field: "JSON", status: "fail", message: `Invalid JSON: ${e instanceof Error ? e.message : "Unknown error"}` }],
        raw: content,
      });
    }
  });

  return validations;
}

function extractSchemasFromHTML(html: string): SchemaValidation[] {
  const validations: SchemaValidation[] = [];
  const jsonLdRegex =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match: RegExpExecArray | null;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    const content = (match[1] || "").trim();
    try {
      const parsed = JSON.parse(content);
      if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
        for (const schema of parsed["@graph"]) validations.push(validateSchema(schema as JsonRecord));
      } else {
        validations.push(validateSchema(parsed as JsonRecord));
      }
    } catch (e) {
      validations.push({
        type: "Parse Error",
        valid: false,
        results: [{ field: "JSON", status: "fail", message: `Invalid JSON: ${e instanceof Error ? e.message : "Unknown error"}` }],
        raw: content,
      });
    }
  }

  return validations;
}

function StatusIcon({ status }: { status: "pass" | "fail" | "warn" }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
  if (status === "fail") return <XCircle className="h-4 w-4 text-red-600 shrink-0" />;
  return <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />;
}

function SchemaCard({ validation }: { validation: SchemaValidation }) {
  const [showRaw, setShowRaw] = useState(false);

  const bgClass = validation.valid
    ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
    : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20";

  return (
    <div className={`border rounded-lg p-4 ${bgClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <StatusIcon status={validation.valid ? "pass" : "fail"} />
        <span className="font-semibold">{validation.type}</span>
        <Badge variant={validation.valid ? "default" : "destructive"}>
          {validation.valid ? "PASS" : "FAIL"}
        </Badge>
      </div>

      <div className="space-y-1.5 mb-4">
        {validation.results.map((result, j) => (
          <div key={j} className="flex items-start gap-2 text-sm">
            <StatusIcon status={result.status} />
            <span className="font-mono text-muted-foreground min-w-[120px] shrink-0">
              {result.field}
            </span>
            <span
              className={
                result.status === "fail"
                  ? "text-red-700 dark:text-red-400 break-all"
                  : result.status === "warn"
                    ? "text-yellow-700 dark:text-yellow-400 break-all"
                    : "break-all"
              }
            >
              {result.message}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowRaw((s) => !s)}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        type="button"
      >
        <Code2 className="h-3 w-3" />
        {showRaw ? "Hide" : "View"} raw JSON-LD
      </button>

      {showRaw && (
        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-h-48">
          {JSON.stringify(validation.raw, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function StructuredDataDebug() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [testRoute, setTestRoute] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [validations, setValidations] = useState<SchemaValidation[]>([]);
  const [source, setSource] = useState<SourceKind>("dom");
  const [route, setRoute] = useState<string>(window.location.pathname);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = validations.length;
    const passed = validations.filter((v) => v.valid).length;
    const failed = total - passed;
    return { total, passed, failed, allValid: total > 0 && failed === 0 };
  }, [validations]);

  const validateCurrentDOM = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setSource("dom");
    setRoute(window.location.pathname);

    setTimeout(() => {
      setValidations(extractSchemasFromDOM());
      setIsLoading(false);
    }, 150);
  }, []);

  const validateFetchedRoute = useCallback(
    async (rawRoute: string) => {
      const normalized = rawRoute.startsWith("/") ? rawRoute : `/${rawRoute}`;

      setIsLoading(true);
      setError(null);
      setSource("fetch");
      setRoute(normalized);

      try {
        const resp = await fetch(normalized, {
          credentials: "same-origin",
          headers: { Accept: "text/html" },
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);

        const html = await resp.text();
        setValidations(extractSchemasFromHTML(html));
        setSearchParams({ test: normalized }, { replace: true });
      } catch (e) {
        setValidations([]);
        setError(e instanceof Error ? e.message : "Failed to fetch route");
      } finally {
        setIsLoading(false);
      }
    },
    [setSearchParams]
  );

  useEffect(() => {
    const test = searchParams.get("test");
    if (test) {
      setTestRoute(test);
      void validateFetchedRoute(test);
    } else {
      validateCurrentDOM();
    }
  }, [searchParams, validateFetchedRoute, validateCurrentDOM]);

  return (
    <Layout>
      <Helmet>
        <title>Structured Data Debug | TheDealCalc (Internal)</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Structured Data Validator</h1>
          <p className="text-sm text-muted-foreground">JSON-LD schema.org validation — noindex</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Overall Status</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => validateCurrentDOM()} type="button">
                <RefreshCw className="h-4 w-4 mr-2" /> Validate DOM
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {error ? (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">Fetch Error</div>
                  <div className="text-sm text-muted-foreground break-all">{error}</div>
                </div>
              </div>
            ) : stats.total === 0 ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium">No Structured Data Found</div>
                  <div className="text-sm text-muted-foreground">Expected at least BreadcrumbList on indexable pages</div>
                </div>
              </div>
            ) : stats.allValid ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">All Schemas Valid</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.passed} passed, {stats.failed} failed of {stats.total} total
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium">{stats.failed} schema(s) failed</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.passed} passed, {stats.failed} failed of {stats.total} total
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fetch & Validate Route</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                value={testRoute}
                onChange={(e) => setTestRoute(e.target.value)}
                placeholder="/npv-calculator"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && testRoute.trim()) void validateFetchedRoute(testRoute.trim());
                }}
              />
              <Button
                onClick={() => {
                  if (testRoute.trim()) void validateFetchedRoute(testRoute.trim());
                }}
                disabled={isLoading || !testRoute.trim()}
                type="button"
              >
                <Search className="h-4 w-4 mr-2" />
                Validate
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Fetches the route HTML and extracts JSON-LD blocks for validation. Does not navigate away.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Results</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{source === "dom" ? "DOM" : "Fetched"}</Badge>
              <Badge variant="outline">{route}</Badge>
              {source === "fetch" && (
                <Button
                  variant="ghost"
                  onClick={() => setSearchParams({ test: route }, { replace: true })}
                  type="button"
                >
                  permalink
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Extracting structured data...</div>
            ) : validations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No JSON-LD structured data found.</div>
            ) : (
              validations.map((v, i) => <SchemaCard key={`${v.type}-${i}`} validation={v} />)
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
