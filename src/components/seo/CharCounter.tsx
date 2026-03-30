"use client";

/**
 * CharCounter — Character count progress bar with color feedback
 *
 * Usage:
 *   <CharCounter
 *     value={metaTitle}
 *     min={30}
 *     max={60}
 *     label="Meta titulo"
 *   />
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CharCounterProps {
  value: string;
  min: number;
  max: number;
  label: string;
  className?: string;
}

type CountStatus = "empty" | "too_short" | "ok" | "warning" | "over";

// ─── Derived status helpers ───────────────────────────────────────────────────

function getStatus(count: number, min: number, max: number): CountStatus {
  if (count === 0) return "empty";
  if (count < min) return "too_short";
  if (count <= max) return "ok";
  if (count <= Math.floor(max * 1.1)) return "warning";
  return "over";
}

interface StatusConfig {
  barColor: string;
  countColor: string;
  message: string | null;
}

function getStatusConfig(status: CountStatus, min: number, max: number): StatusConfig {
  switch (status) {
    case "empty":
      return {
        barColor: "bg-gray-200",
        countColor: "text-muted-foreground",
        message: null,
      };
    case "too_short":
      return {
        barColor: "bg-amber-400",
        countColor: "text-amber-600",
        message: `Minimo recomendado: ${min} caracteres`,
      };
    case "ok":
      return {
        barColor: "bg-emerald-500",
        countColor: "text-emerald-600",
        message: null,
      };
    case "warning":
      return {
        barColor: "bg-orange-400",
        countColor: "text-orange-500",
        message: `Cerca del limite de ${max} caracteres`,
      };
    case "over":
      return {
        barColor: "bg-red-500",
        countColor: "text-red-600",
        message: `Excede el limite de ${max} caracteres`,
      };
  }
}

// ─── Progress bar fill calculation ───────────────────────────────────────────

/**
 * Maps character count to a 0-100 percentage for the progress bar.
 *
 * Zones:
 *   0..min       → 0% .. 40%   (ramp up through "too short" zone)
 *   min..max     → 40% .. 85%  (ideal range)
 *   max..max*1.1 → 85% .. 95%  (warning zone)
 *   max*1.1+     → 95% .. 100% (capped at 100, bar turns red)
 */
function calcFillPct(count: number, min: number, max: number): number {
  if (count <= 0) return 0;
  const warnThreshold = Math.floor(max * 1.1);

  if (count <= min) {
    return (count / min) * 40;
  }
  if (count <= max) {
    return 40 + ((count - min) / (max - min)) * 45;
  }
  if (count <= warnThreshold) {
    return 85 + ((count - max) / (warnThreshold - max)) * 10;
  }
  return Math.min(100, 95 + ((count - warnThreshold) / (warnThreshold * 0.1)) * 5);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CharCounter({ value, min, max, label, className }: CharCounterProps) {
  const count = value.length;

  const status = useMemo(() => getStatus(count, min, max), [count, min, max]);
  const config = useMemo(() => getStatusConfig(status, min, max), [status, min, max]);
  const fillPct = useMemo(() => calcFillPct(count, min, max), [count, min, max]);

  return (
    <div className={cn("space-y-1.5", className)} role="group" aria-label={`Contador de caracteres: ${label}`}>
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span
          className={cn("text-xs font-semibold tabular-nums transition-colors duration-200", config.countColor)}
          aria-live="polite"
          aria-atomic="true"
        >
          {count}/{max}
        </span>
      </div>

      {/* Progress bar track */}
      <div
        className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${count} de ${max} caracteres`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            config.barColor
          )}
          style={{ width: `${fillPct}%` }}
        />
      </div>

      {/* Contextual message */}
      {config.message && (
        <p
          className={cn("text-[11px] leading-tight transition-colors duration-200", config.countColor)}
          role="status"
          aria-live="polite"
        >
          {config.message}
        </p>
      )}

      {/* Ideal range hint — only when empty */}
      {status === "empty" && (
        <p className="text-[11px] text-muted-foreground leading-tight">
          Ideal: {min}–{max} caracteres
        </p>
      )}
    </div>
  );
}
