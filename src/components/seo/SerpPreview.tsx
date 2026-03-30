"use client";

/**
 * SerpPreview — Google SERP result preview
 *
 * Usage:
 *   <SerpPreview
 *     title="Buy Premium Cameras Online | ImagiQ"
 *     description="Explore our curated selection of professional cameras, lenses and accessories. Fast shipping across Colombia."
 *     url="https://imagiq.co/cameras"
 *     favicon="https://imagiq.co/favicon.ico"
 *   />
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerpPreviewProps {
  title: string;
  description: string;
  url: string;
  favicon?: string;
}

type ViewMode = "desktop" | "mobile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trimEnd() + "...";
}

function parseUrl(raw: string): { domain: string; breadcrumb: string } {
  try {
    const parsed = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const domain = parsed.hostname.replace(/^www\./, "");
    const pathParts = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map((p) => decodeURIComponent(p.replace(/-/g, " ")));
    const breadcrumb = [domain, ...pathParts].join(" › ");
    return { domain, breadcrumb };
  } catch {
    return { domain: raw, breadcrumb: raw };
  }
}

// ─── Desktop result card ──────────────────────────────────────────────────────

function DesktopResult({
  title,
  description,
  url,
  favicon,
}: SerpPreviewProps) {
  const { domain, breadcrumb } = parseUrl(url);
  const displayTitle = truncate(title || "Page title", TITLE_LIMIT);
  const displayDesc = truncate(
    description || "Page description will appear here.",
    DESC_LIMIT
  );

  return (
    <div className="max-w-[600px]">
      {/* Site identity row */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-[26px] h-[26px] rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt={domain}
              width={16}
              height={16}
              className="w-4 h-4 object-contain"
            />
          ) : (
            <span className="text-[10px] text-gray-500 font-medium uppercase">
              {domain.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] text-[#202124] font-medium">
            {domain}
          </span>
          <span className="text-[12px] text-[#4d5156] leading-[1.3]">
            {breadcrumb}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-[20px] font-normal text-[#1a0dab] leading-[1.3] hover:underline cursor-pointer mb-1"
        style={{ fontFamily: "arial, sans-serif" }}
      >
        {displayTitle}
      </h3>

      {/* Description */}
      <p
        className="text-[14px] text-[#4d5156] leading-[1.57]"
        style={{ fontFamily: "arial, sans-serif" }}
      >
        {displayDesc}
      </p>
    </div>
  );
}

// ─── Mobile result card ───────────────────────────────────────────────────────

function MobileResult({ title, description, url, favicon }: SerpPreviewProps) {
  const { domain, breadcrumb } = parseUrl(url);
  const displayTitle = truncate(title || "Page title", 55);
  const displayDesc = truncate(
    description || "Page description will appear here.",
    120
  );

  return (
    <div className="max-w-[360px]">
      {/* Site identity row */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-[24px] h-[24px] rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt={domain}
              width={14}
              height={14}
              className="w-[14px] h-[14px] object-contain"
            />
          ) : (
            <span className="text-[9px] text-gray-500 font-medium uppercase">
              {domain.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[12px] text-[#202124] font-medium truncate">
            {domain}
          </span>
          <span className="text-[11px] text-[#4d5156] leading-[1.3] truncate">
            {breadcrumb}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-[18px] font-normal text-[#1a0dab] leading-[1.3] hover:underline cursor-pointer mb-1"
        style={{ fontFamily: "arial, sans-serif" }}
      >
        {displayTitle}
      </h3>

      {/* Description */}
      <p
        className="text-[13px] text-[#4d5156] leading-[1.5]"
        style={{ fontFamily: "arial, sans-serif" }}
      >
        {displayDesc}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SerpPreview(props: SerpPreviewProps) {
  const [mode, setMode] = useState<ViewMode>("desktop");

  const titleOver = props.title.length > TITLE_LIMIT;
  const descOver = props.description.length > DESC_LIMIT;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Vista previa SERP</CardTitle>
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as ViewMode)}
          >
            <TabsList className="h-7">
              <TabsTrigger value="desktop" className="text-xs px-2 h-5">
                Escritorio
              </TabsTrigger>
              <TabsTrigger value="mobile" className="text-xs px-2 h-5">
                Movil
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        {/* Google-style container */}
        <div
          className={cn(
            "bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200",
            mode === "mobile" && "max-w-[400px]"
          )}
        >
          {/* Simulated Google search bar */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <div className="flex gap-[3px] items-center">
              <span className="text-[22px] font-bold text-[#4285F4]">G</span>
              <span className="text-[22px] font-bold text-[#EA4335]">o</span>
              <span className="text-[22px] font-bold text-[#FBBC04]">o</span>
              <span className="text-[22px] font-bold text-[#4285F4]">g</span>
              <span className="text-[22px] font-bold text-[#34A853]">l</span>
              <span className="text-[22px] font-bold text-[#EA4335]">e</span>
            </div>
            <div
              className={cn(
                "flex-1 h-8 rounded-full border border-gray-300 bg-white flex items-center px-3",
                mode === "mobile" ? "text-[12px]" : "text-[14px]"
              )}
            >
              <span className="text-gray-400 truncate">
                {new URL(
                  props.url.startsWith("http")
                    ? props.url
                    : `https://${props.url}`
                ).hostname.replace(/^www\./, "") || "busqueda..."}
              </span>
            </div>
          </div>

          {/* Actual result preview */}
          {mode === "desktop" ? (
            <DesktopResult {...props} />
          ) : (
            <MobileResult {...props} />
          )}
        </div>

        {/* Overflow warnings */}
        {(titleOver || descOver) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {titleOver && (
              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                Titulo excede {TITLE_LIMIT} caracteres — sera truncado
              </span>
            )}
            {descOver && (
              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                Descripcion excede {DESC_LIMIT} caracteres — sera truncada
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
