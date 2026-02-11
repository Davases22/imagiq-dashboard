"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { FormLayout, FormLayoutType } from "@/types/form-page";
import { FORM_LAYOUT_LABELS } from "@/types/form-page";

interface FormLayoutSelectorProps {
  layout: FormLayout;
  onLayoutChange: (layout: FormLayout) => void;
}

const LAYOUT_OPTIONS: { type: FormLayoutType; icon: React.ReactNode }[] = [
  {
    type: "banner_top",
    icon: (
      <div className="w-full h-full flex flex-col gap-1">
        <div className="bg-primary/20 rounded h-2/5" />
        <div className="bg-primary/10 rounded flex-1 border border-dashed border-primary/30" />
      </div>
    ),
  },
  {
    type: "banner_left",
    icon: (
      <div className="w-full h-full flex gap-1">
        <div className="bg-primary/20 rounded w-2/5" />
        <div className="bg-primary/10 rounded flex-1 border border-dashed border-primary/30" />
      </div>
    ),
  },
  {
    type: "banner_right",
    icon: (
      <div className="w-full h-full flex gap-1">
        <div className="bg-primary/10 rounded flex-1 border border-dashed border-primary/30" />
        <div className="bg-primary/20 rounded w-2/5" />
      </div>
    ),
  },
  {
    type: "banner_behind",
    icon: (
      <div className="w-full h-full relative">
        <div className="absolute inset-0 bg-primary/20 rounded" />
        <div className="absolute inset-2 bg-background/80 rounded border border-dashed border-primary/30" />
      </div>
    ),
  },
  {
    type: "form_only",
    icon: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-3/5 h-4/5 bg-primary/10 rounded border border-dashed border-primary/30" />
      </div>
    ),
  },
];

export function FormLayoutSelector({ layout, onLayoutChange }: FormLayoutSelectorProps) {
  const showBannerWidth = ["banner_left", "banner_right"].includes(layout.type);

  return (
    <div className="space-y-4">
      {/* Layout grid */}
      <div className="grid grid-cols-5 gap-3">
        {LAYOUT_OPTIONS.map(({ type, icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onLayoutChange({ ...layout, type })}
            className={cn(
              "aspect-[4/3] rounded-lg border-2 p-2 transition-all hover:border-primary/50",
              layout.type === type ? "border-primary bg-primary/5" : "border-muted"
            )}
          >
            {icon}
            <p className="text-[10px] text-center mt-1 leading-tight">{FORM_LAYOUT_LABELS[type]}</p>
          </button>
        ))}
      </div>

      {/* Banner width slider (only for lateral layouts) */}
      {showBannerWidth && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Proporción banner / formulario</Label>
            <span className="text-sm text-muted-foreground">
              {layout.banner_width || 50}% / {100 - (layout.banner_width || 50)}%
            </span>
          </div>
          <Slider
            value={[layout.banner_width || 50]}
            onValueChange={([v]) => onLayoutChange({ ...layout, banner_width: v, form_width: 100 - v })}
            min={25}
            max={60}
            step={5}
          />
        </div>
      )}

      {/* Overlay opacity (only for banner_behind) */}
      {layout.type === "banner_behind" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Opacidad del overlay</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round((layout.banner_overlay_opacity || 0.5) * 100)}%
            </span>
          </div>
          <Slider
            value={[Math.round((layout.banner_overlay_opacity || 0.5) * 100)]}
            onValueChange={([v]) => onLayoutChange({ ...layout, banner_overlay_opacity: v / 100 })}
            min={10}
            max={90}
            step={5}
          />
        </div>
      )}
    </div>
  );
}
