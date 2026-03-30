"use client";

/**
 * OgPreview — Social media Open Graph card preview
 *
 * Usage:
 *   <OgPreview
 *     title="Camaras profesionales en Colombia"
 *     description="Encuentra las mejores camaras DSLR y mirrorless con envio rapido."
 *     image="https://imagiq.co/og-image.jpg"
 *     siteName="ImagiQ"
 *     url="https://imagiq.co/camaras"
 *   />
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OgPreviewProps {
  title: string;
  description: string;
  image?: string;
  siteName: string;
  url: string;
}

type Platform = "facebook" | "twitter";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toUpperCase();
  } catch {
    return url.toUpperCase();
  }
}

function truncate(text: string, limit: number): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.slice(0, limit).trimEnd() + "...";
}

// ─── Placeholder image ────────────────────────────────────────────────────────

function ImagePlaceholder({ platform }: { platform: Platform }) {
  return (
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center bg-gray-100 border-b border-gray-200",
        platform === "facebook" ? "aspect-[1.91/1]" : "aspect-[2/1]"
      )}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        className="text-gray-300 mb-2"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path
          d="M21 15l-5-5L5 21"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs text-gray-400 font-medium">Sin imagen OG</span>
      <span className="text-[10px] text-gray-300 mt-0.5">1200 x 630 px recomendado</span>
    </div>
  );
}

// ─── Facebook card ────────────────────────────────────────────────────────────

function FacebookCard({ title, description, image, siteName, url }: OgPreviewProps) {
  const domain = extractDomain(url || siteName);
  const [imgError, setImgError] = useState(false);
  const showImage = image && !imgError;

  return (
    <div className="max-w-[500px] rounded-none overflow-hidden border border-[#dddfe2] bg-white">
      {/* Image area — 1.91:1 */}
      {showImage ? (
        <div className="w-full aspect-[1.91/1] overflow-hidden bg-gray-100 border-b border-[#dddfe2]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <ImagePlaceholder platform="facebook" />
      )}

      {/* Text area */}
      <div className="px-3 py-2 bg-[#f2f3f5]">
        <p className="text-[11px] uppercase text-[#606770] tracking-wide mb-0.5 truncate">
          {domain}
        </p>
        <p className="text-[16px] font-semibold text-[#1d2129] leading-[20px] line-clamp-2">
          {truncate(title, 88) || "Titulo de la pagina"}
        </p>
        <p className="text-[14px] text-[#606770] leading-[18px] mt-0.5 line-clamp-1">
          {truncate(description, 110) || "Descripcion de la pagina"}
        </p>
      </div>
    </div>
  );
}

// ─── Twitter/X card ───────────────────────────────────────────────────────────

function TwitterCard({ title, description, image, siteName, url }: OgPreviewProps) {
  const domain = extractDomain(url || siteName);
  const [imgError, setImgError] = useState(false);
  const showImage = image && !imgError;

  return (
    <div className="max-w-[504px] rounded-2xl overflow-hidden border border-[#cfd9de] bg-black">
      {/* Image area */}
      {showImage ? (
        <div className="w-full aspect-[2/1] overflow-hidden bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="aspect-[2/1] flex flex-col items-center justify-center bg-[#16181c]">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="text-gray-600 mb-2"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path
              d="M21 15l-5-5L5 21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs text-gray-500 font-medium">Sin imagen OG</span>
        </div>
      )}

      {/* Text area */}
      <div className="px-3 py-2">
        <p className="text-[15px] font-bold text-white leading-5 line-clamp-2 mb-0.5">
          {truncate(title, 70) || "Titulo de la pagina"}
        </p>
        <p className="text-[15px] text-[#71767b] leading-5 line-clamp-2 mb-1">
          {truncate(description, 125) || "Descripcion de la pagina"}
        </p>
        <p className="text-[15px] text-[#71767b] truncate">{domain.toLowerCase()}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OgPreview(props: OgPreviewProps) {
  const [platform, setPlatform] = useState<Platform>("facebook");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Vista previa redes sociales</CardTitle>
          <Tabs
            value={platform}
            onValueChange={(v) => setPlatform(v as Platform)}
          >
            <TabsList className="h-7">
              <TabsTrigger value="facebook" className="text-xs px-2 h-5">
                Facebook
              </TabsTrigger>
              <TabsTrigger value="twitter" className="text-xs px-2 h-5">
                X / Twitter
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex justify-center">
          {platform === "facebook" ? (
            <FacebookCard {...props} />
          ) : (
            <TwitterCard {...props} />
          )}
        </div>

        {/* OG image hint */}
        {!props.image && (
          <p className="mt-3 text-[11px] text-muted-foreground text-center">
            Sin imagen OG configurada. Se recomienda una imagen de 1200x630 px.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
