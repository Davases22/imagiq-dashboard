/**
 * Componentes reutilizables para controles de estilo de texto
 */

import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FontWeightSelectProps {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
  readonly weights?: Array<{ value: string; label: string }>;
}

const defaultWeights = [
  { value: "300", label: "Light" },
  { value: "400", label: "Normal" },
  { value: "600", label: "SemiBold" },
  { value: "700", label: "Bold" },
  { value: "900", label: "Black" },
];

export const FontWeightSelect = memo(function FontWeightSelect({
  value,
  onChange,
  weights = defaultWeights,
}: FontWeightSelectProps) {
  return (
    <div>
      <Label className="text-xs">Peso</Label>
      <Select value={value || "400"} onValueChange={onChange}>
        <SelectTrigger className="text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {weights.map((w) => (
            <SelectItem key={w.value} value={w.value}>
              {w.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

interface LineHeightSliderProps {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

export const LineHeightSlider = memo(function LineHeightSlider({
  value,
  onChange,
  min = 0.8,
  max = 3,
  step = 0.1,
}: LineHeightSliderProps) {
  const numValue = value ? Number.parseFloat(value) : 1.2;
  
  return (
    <div>
      <Label className="text-xs flex justify-between">
        <span>Altura</span>
        <span className="font-mono">{numValue.toFixed(1)}</span>
      </Label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numValue}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value);
        }}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
});

interface ColorPickerProps {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
  readonly defaultColor?: string;
}

export const ColorPicker = memo(function ColorPicker({
  value,
  onChange,
  defaultColor = "#ffffff",
}: ColorPickerProps) {
  const currentColor = value || defaultColor;

  return (
    <div>
      <Label className="text-xs">Color</Label>
      <Input
        type="color"
        value={currentColor}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="h-8 cursor-pointer"
      />
    </div>
  );
});

interface TextAlignSelectProps {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
}

export const TextAlignSelect = memo(function TextAlignSelect({
  value,
  onChange,
}: TextAlignSelectProps) {
  return (
    <div>
      <Label className="text-xs">Alineación</Label>
      <Select value={value || "left"} onValueChange={onChange}>
        <SelectTrigger className="text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="left">Izquierda</SelectItem>
          <SelectItem value="center">Centro</SelectItem>
          <SelectItem value="right">Derecha</SelectItem>
          <SelectItem value="justify">Justificar</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

interface TextTransformSelectProps {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
}

export const TextTransformSelect = memo(function TextTransformSelect({
  value,
  onChange,
}: TextTransformSelectProps) {
  return (
    <div>
      <Label className="text-xs">Transformar</Label>
      <Select value={value || "none"} onValueChange={onChange}>
        <SelectTrigger className="text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Normal</SelectItem>
          <SelectItem value="uppercase">MAYÚSCULAS</SelectItem>
          <SelectItem value="lowercase">minúsculas</SelectItem>
          <SelectItem value="capitalize">Capitalizar</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

interface PaddingSliderProps {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
}

export const PaddingSlider = memo(function PaddingSlider({
  value,
  onChange,
}: PaddingSliderProps) {
  // Parse padding value like "12px 24px" or "12px"
  const parts = (value || "12px 24px").split(" ");
  const vertical = Number.parseInt(parts[0]) || 12;
  const horizontal = Number.parseInt(parts[1] || parts[0]) || 24;

  const handleVerticalChange = (newVertical: number) => {
    onChange(`${newVertical}px ${horizontal}px`);
  };

  const handleHorizontalChange = (newHorizontal: number) => {
    onChange(`${vertical}px ${newHorizontal}px`);
  };

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs flex justify-between">
          <span>⬍⬍ Vertical</span>
          <span className="font-mono">{vertical}px</span>
        </Label>
        <input
          type="range"
          min={4}
          max={40}
          step={1}
          value={vertical}
          onChange={(e) => {
            e.stopPropagation();
            handleVerticalChange(Number.parseInt(e.target.value));
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
      </div>
      <div>
        <Label className="text-xs flex justify-between">
          <span>⬌⬌ Horizontal</span>
          <span className="font-mono">{horizontal}px</span>
        </Label>
        <input
          type="range"
          min={8}
          max={80}
          step={1}
          value={horizontal}
          onChange={(e) => {
            e.stopPropagation();
            handleHorizontalChange(Number.parseInt(e.target.value));
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
      </div>
    </div>
  );
});

interface BorderRadiusSliderProps {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
}

export const BorderRadiusSlider = memo(function BorderRadiusSlider({
  value,
  onChange,
}: BorderRadiusSliderProps) {
  const numValue = Number.parseInt(value || "8") || 8;

  return (
    <div>
      <Label className="text-xs flex justify-between">
        <span>Redondeo</span>
        <span className="font-mono">{numValue}px</span>
      </Label>
      <input
        type="range"
        min={0}
        max={50}
        step={1}
        value={numValue}
        onChange={(e) => {
          e.stopPropagation();
          onChange(`${e.target.value}px`);
        }}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Cuadrado</span>
        <span>Redondeado</span>
      </div>
    </div>
  );
});

interface BorderWidthSliderProps {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
}

export const BorderWidthSlider = memo(function BorderWidthSlider({
  value,
  onChange,
}: BorderWidthSliderProps) {
  // Parse border like "2px solid #000000" or "none"
  const isNone = !value || value === "none";
  const parts = (value || "2px solid #000000").split(" ");
  const width = Number.parseInt(parts[0]) || 2;
  const style = parts[1] || "solid";
  const color = parts[2] || "#000000";

  const handleWidthChange = (newWidth: number) => {
    if (newWidth === 0) {
      onChange("none");
    } else {
      onChange(`${newWidth}px ${style} ${color}`);
    }
  };

  const handleColorChange = (newColor: string) => {
    onChange(`${width}px ${style} ${newColor}`);
  };

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs flex justify-between">
          <span>Grosor del borde</span>
          <span className="font-mono">{isNone ? "Sin borde" : `${width}px`}</span>
        </Label>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={isNone ? 0 : width}
          onChange={(e) => {
            e.stopPropagation();
            handleWidthChange(Number.parseInt(e.target.value));
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-600"
        />
      </div>
      {!isNone && (
        <div>
          <Label className="text-xs">Color del borde</Label>
          <Input
            type="color"
            value={color}
            onChange={(e) => {
              e.stopPropagation();
              handleColorChange(e.target.value);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="h-8 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
});
