/**
 * Componente reutilizable para controlar el tamaño de fuente con slider
 * Muestra preview en tiempo real y maneja conversión entre px y rem
 */

import { memo } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FontSizeSliderProps {
  readonly value: string | undefined;
  readonly onChange: (fontSize: string) => void;
  readonly min?: number;
  readonly max?: number;
  readonly defaultSize?: number;
}

// Convertir fontSize de rem/px a número para el slider
const parseFontSize = (fontSize: string | undefined, defaultSize: number): number => {
  if (!fontSize) return defaultSize;
  const numValue = Number.parseFloat(fontSize);
  if (fontSize.includes('rem')) return numValue * 16;
  return numValue;
};

// Convertir número del slider a rem
const formatFontSize = (px: number): string => {
  return `${(px / 16).toFixed(2)}rem`;
};

export const FontSizeSlider = memo(function FontSizeSlider({
  value,
  onChange,
  min = 10,
  max = 120,
  defaultSize = 16,
}: FontSizeSliderProps) {
  const currentPx = parseFontSize(value, defaultSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs">Tamaño de Fuente</Label>
        <span className="text-xs font-mono text-muted-foreground">
          {currentPx}px ({formatFontSize(currentPx)})
        </span>
      </div>
      <Slider
        value={[currentPx]}
        onValueChange={([newValue]) => onChange(formatFontSize(newValue))}
        min={min}
        max={max}
        step={1}
        className="w-full"
      />
    </div>
  );
});
