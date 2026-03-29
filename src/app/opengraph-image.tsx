import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CREagentic - AI-Powered LOI Redlining for Commercial Real Estate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0B1221",
          padding: "60px",
        }}
      >
        {/* Logo Area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
            }}
          >
            CRE
            <span style={{ color: "#3B82F6" }}>agentic</span>
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#94A3B8",
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: "800px",
            marginBottom: "48px",
          }}
        >
          AI-Powered LOI Redlining for Commercial Real Estate
        </div>

        {/* Accent */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 28px",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderRadius: "12px",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <span
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#3B82F6",
            }}
          >
            $2 per document
          </span>
          <span
            style={{
              fontSize: "20px",
              color: "#64748B",
            }}
          >
            &bull; 60 seconds &bull; No subscription
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
