"use client";

/**
 * RobotsPreview — Live robots.txt code preview
 *
 * Usage:
 *   <RobotsPreview
 *     disallowPaths={["/admin", "/api/private"]}
 *     aiPolicy="block_training"
 *     siteUrl="https://imagiq.co"
 *   />
 */

import { useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AiPolicy = "allow_all" | "block_training" | "block_all";

export interface RobotsPreviewProps {
  disallowPaths: string[];
  aiPolicy: AiPolicy;
  siteUrl: string;
  className?: string;
}

// ─── AI crawler sets ──────────────────────────────────────────────────────────

/**
 * Known AI training crawlers — sourced from public robots.txt research (2024-2025).
 */
const AI_TRAINING_CRAWLERS: string[] = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "anthropic-ai",
  "Claude-Web",
  "ClaudeBot",
  "Google-Extended",
  "Omgilibot",
  "FacebookBot",
  "Bytespider",
  "PerplexityBot",
];

/**
 * All AI crawlers (training + inference/search).
 */
const ALL_AI_CRAWLERS: string[] = [
  ...AI_TRAINING_CRAWLERS,
  "Applebot-Extended",
  "cohere-ai",
  "Diffbot",
  "ImagesiftBot",
  "magpie-crawler",
  "Timpibot",
  "YouBot",
];

// ─── Generator ────────────────────────────────────────────────────────────────

function generateRobotsTxt(
  disallowPaths: string[],
  aiPolicy: AiPolicy,
  siteUrl: string
): string {
  const normalizedUrl = siteUrl.replace(/\/$/, "");
  const sitemapUrl = `${normalizedUrl}/sitemap.xml`;

  const lines: string[] = [];

  // ── Default crawlers block ────────────────────────────────────────────────
  lines.push("# Default crawlers");
  lines.push("User-agent: *");

  const validPaths = disallowPaths
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && p.startsWith("/"));

  if (validPaths.length > 0) {
    validPaths.forEach((p) => lines.push(`Disallow: ${p}`));
  } else {
    lines.push("Disallow:");
  }

  lines.push("Allow: /");
  lines.push("");

  // ── AI policy block ───────────────────────────────────────────────────────
  if (aiPolicy === "block_training") {
    lines.push("# AI training crawlers — blocked");
    AI_TRAINING_CRAWLERS.forEach((bot) => {
      lines.push(`User-agent: ${bot}`);
      lines.push("Disallow: /");
      lines.push("");
    });
  } else if (aiPolicy === "block_all") {
    lines.push("# All AI crawlers — blocked");
    ALL_AI_CRAWLERS.forEach((bot) => {
      lines.push(`User-agent: ${bot}`);
      lines.push("Disallow: /");
      lines.push("");
    });
  } else {
    lines.push("# AI crawlers — allowed (no restrictions)");
    lines.push("");
  }

  // ── Sitemap ───────────────────────────────────────────────────────────────
  lines.push(`Sitemap: ${sitemapUrl}`);

  return lines.join("\n");
}

// ─── Line syntax highlighting ─────────────────────────────────────────────────

interface TokenizedLine {
  key: string | null;
  value: string | null;
  isComment: boolean;
  raw: string;
}

function tokenizeLine(line: string): TokenizedLine {
  if (line.startsWith("#")) {
    return { key: null, value: null, isComment: true, raw: line };
  }
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) {
    return { key: null, value: null, isComment: false, raw: line };
  }
  const key = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1).trimStart();
  return { key, value, isComment: false, raw: line };
}

interface HighlightedLineProps {
  line: TokenizedLine;
  index: number;
}

function HighlightedLine({ line, index }: HighlightedLineProps) {
  if (line.raw === "") {
    return <div className="h-4" aria-hidden="true" />;
  }

  if (line.isComment) {
    return (
      <div className="flex items-start gap-3">
        <span className="select-none text-[#4b5563] w-8 text-right flex-shrink-0 text-xs leading-5">
          {index + 1}
        </span>
        <span className="text-[#6b7280] italic">{line.raw}</span>
      </div>
    );
  }

  if (line.key === null) {
    return (
      <div className="flex items-start gap-3">
        <span className="select-none text-[#4b5563] w-8 text-right flex-shrink-0 text-xs leading-5">
          {index + 1}
        </span>
        <span className="text-[#d1d5db]">{line.raw}</span>
      </div>
    );
  }

  const keyColorMap: Record<string, string> = {
    "User-agent": "text-[#93c5fd]",
    "Disallow": "text-[#fca5a5]",
    "Allow": "text-[#86efac]",
    "Sitemap": "text-[#c4b5fd]",
    "Crawl-delay": "text-[#fde68a]",
  };

  const keyColor = keyColorMap[line.key] ?? "text-[#e5e7eb]";
  const showValue = line.value !== undefined && line.value !== null;

  return (
    <div className="flex items-start gap-3">
      <span className="select-none text-[#4b5563] w-8 text-right flex-shrink-0 text-xs leading-5">
        {index + 1}
      </span>
      <span>
        <span className={cn("font-medium", keyColor)}>{line.key}</span>
        <span className="text-[#6b7280]">:</span>
        {showValue && line.value !== "" && (
          <>
            <span className="text-[#d1d5db]"> </span>
            <span className="text-[#fde68a]">{line.value}</span>
          </>
        )}
      </span>
    </div>
  );
}

// ─── Policy badge ─────────────────────────────────────────────────────────────

const POLICY_LABELS: Record<AiPolicy, string> = {
  allow_all: "IA: permitida",
  block_training: "IA: bloquear entrenamiento",
  block_all: "IA: bloquear todo",
};

const POLICY_VARIANTS: Record<AiPolicy, "default" | "secondary" | "destructive" | "outline"> = {
  allow_all: "secondary",
  block_training: "outline",
  block_all: "destructive",
};

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API not available — silent fail
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[11px] text-[#6b7280] hover:text-[#d1d5db] transition-colors duration-150 px-2 py-0.5 rounded border border-[#374151] hover:border-[#4b5563] bg-[#1f2937] cursor-pointer"
      aria-label="Copiar robots.txt al portapapeles"
    >
      Copiar
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RobotsPreview({
  disallowPaths,
  aiPolicy,
  siteUrl,
  className,
}: RobotsPreviewProps) {
  const content = useMemo(
    () => generateRobotsTxt(disallowPaths, aiPolicy, siteUrl),
    [disallowPaths, aiPolicy, siteUrl]
  );

  const tokenizedLines = useMemo(
    () => content.split("\n").map(tokenizeLine),
    [content]
  );

  const lineCount = tokenizedLines.filter((l) => l.raw !== "").length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Vista previa robots.txt</CardTitle>
            <Badge variant={POLICY_VARIANTS[aiPolicy]} className="text-[10px] px-1.5 py-0">
              {POLICY_LABELS[aiPolicy]}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">
              {lineCount} lineas
            </span>
            <CopyButton text={content} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Terminal-style code block */}
        <div
          className="relative rounded-lg overflow-hidden border border-[#374151]"
          role="region"
          aria-label="Contenido generado de robots.txt"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#111827] border-b border-[#374151]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" aria-hidden="true" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" aria-hidden="true" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" aria-hidden="true" />
            <span className="ml-3 text-[11px] text-[#6b7280] font-mono">
              /robots.txt
            </span>
          </div>

          {/* Code area */}
          <div
            className="bg-[#0d1117] overflow-auto max-h-[420px] p-4"
          >
            <pre
              className="font-mono text-[13px] leading-5 text-[#e5e7eb] space-y-0.5"
              aria-readonly="true"
            >
              {tokenizedLines.map((line, i) => (
                <HighlightedLine key={i} line={line} index={i} />
              ))}
            </pre>
          </div>
        </div>

        {/* Disallow paths summary */}
        {disallowPaths.length > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {disallowPaths.filter((p) => p.trim().startsWith("/")).length} ruta(s) bloqueada(s) para todos los robots
          </p>
        )}
      </CardContent>
    </Card>
  );
}
