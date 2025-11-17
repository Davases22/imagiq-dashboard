"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw } from "lucide-react";
import { BannerTextStyles } from "@/types/banner";

interface BannerTextStylesFieldsProps {
  textStyles: BannerTextStyles | undefined;
  onTextStylesChange: (styles: BannerTextStyles) => void;
}

const DEFAULT_STYLES: BannerTextStyles = {
  title: { fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: "700", lineHeight: "1.2" },
  description: { fontSize: "clamp(1rem, 2vw, 1.5rem)", fontWeight: "400", lineHeight: "1.5" },
  cta: { fontSize: "1rem", fontWeight: "600", padding: "0.75rem 1.5rem", borderWidth: "0px" },
};

const FONT_WEIGHTS = [
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semibold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extra Bold (800)" },
  { value: "900", label: "Black (900)" },
];

const remToSlider = (clampStr: string) => {
  const match = clampStr.match(/clamp\([^,]+,[^,]+,\s*(\d+\.?\d*)rem\)/);
  if (!match) return 50;
  const maxRem = 6;
  return Math.round(((parseFloat(match[1]) - 1) / (maxRem - 1)) * 100);
};

const sliderToFontSize = (val: number) => {
  const maxRem = 6;
  const rem = 1 + (val / 100) * (maxRem - 1);
  const vw = rem * 1.25;
  return `clamp(${Math.max(1, rem - 1)}rem, ${vw.toFixed(1)}vw, ${rem.toFixed(2)}rem)`;
};

const paddingToSlider = (pad: string) => {
  const match = pad.match(/(\d+\.?\d*)rem/);
  return match ? Math.round(((parseFloat(match[1]) - 0.25) / 1.75) * 100) : 30;
};

const sliderToPadding = (val: number) => {
  const v = 0.25 + (val / 100) * 1.75;
  return `${v.toFixed(3)}rem ${(v * 2).toFixed(3)}rem`;
};

const borderToSlider = (border: string) => {
  const match = border.match(/(\d+\.?\d*)px/);
  return match ? Math.round((parseFloat(match[1]) / 5) * 100) : 0;
};

const sliderToBorder = (val: number) => `${((val / 100) * 5).toFixed(1)}px`;

const SliderControl = ({ label, value, onChange, min = 0, max = 100, step = 1 }: {
  label: string; value: number; onChange: (val: number) => void; min?: number; max?: number; step?: number;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
  </div>
);

const FontWeightSelect = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
  <div className="space-y-2">
    <Label>Peso de fuente</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {FONT_WEIGHTS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

export function BannerTextStylesFields({ textStyles, onTextStylesChange }: BannerTextStylesFieldsProps) {
  const styles = textStyles || DEFAULT_STYLES;
  const update = (section: keyof BannerTextStyles, field: string, val: string) => {
    onTextStylesChange({ ...styles, [section]: { ...styles[section], [field]: val } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Personaliza el tamaño, peso y espaciado (se escala automáticamente)</p>
        <Button type="button" variant="outline" size="sm" onClick={() => onTextStylesChange(DEFAULT_STYLES)} className="gap-2">
          <RotateCcw className="h-4 w-4" />Restablecer
        </Button>
      </div>

      <Tabs defaultValue="title" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="title">Título</TabsTrigger>
          <TabsTrigger value="description">Descripción</TabsTrigger>
          <TabsTrigger value="cta">CTA</TabsTrigger>
        </TabsList>

        <TabsContent value="title" className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between"><Label>Tamaño</Label><span className="text-sm text-muted-foreground">{styles.title.fontSize}</span></div>
            <Slider value={[remToSlider(styles.title.fontSize)]} onValueChange={([v]) => update("title", "fontSize", sliderToFontSize(v))} max={100} />
          </div>
          <FontWeightSelect value={styles.title.fontWeight} onChange={v => update("title", "fontWeight", v)} />
          <div className="space-y-2">
            <div className="flex justify-between"><Label>Altura de línea</Label><span className="text-sm text-muted-foreground">{styles.title.lineHeight}</span></div>
            <Slider value={[parseFloat(styles.title.lineHeight) * 100 - 80]} onValueChange={([v]) => update("title", "lineHeight", ((v + 80) / 100).toFixed(2))} max={100} step={5} />
          </div>
        </TabsContent>

        <TabsContent value="description" className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between"><Label>Tamaño</Label><span className="text-sm text-muted-foreground">{styles.description.fontSize}</span></div>
            <Slider value={[remToSlider(styles.description.fontSize)]} onValueChange={([v]) => update("description", "fontSize", sliderToFontSize(v))} max={100} />
          </div>
          <FontWeightSelect value={styles.description.fontWeight} onChange={v => update("description", "fontWeight", v)} />
          <div className="space-y-2">
            <div className="flex justify-between"><Label>Altura de línea</Label><span className="text-sm text-muted-foreground">{styles.description.lineHeight}</span></div>
            <Slider value={[parseFloat(styles.description.lineHeight) * 100 - 80]} onValueChange={([v]) => update("description", "lineHeight", ((v + 80) / 100).toFixed(2))} max={100} step={5} />
          </div>
        </TabsContent>

        <TabsContent value="cta" className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between"><Label>Tamaño</Label><span className="text-sm text-muted-foreground">{styles.cta.fontSize}</span></div>
            <Slider value={[parseFloat(styles.cta.fontSize) * 100 - 50]} onValueChange={([v]) => update("cta", "fontSize", `${((v + 50) / 100).toFixed(3)}rem`)} max={100} />
          </div>
          <FontWeightSelect value={styles.cta.fontWeight} onChange={v => update("cta", "fontWeight", v)} />
          <div className="space-y-2">
            <div className="flex justify-between"><Label>Padding</Label><span className="text-sm text-muted-foreground">{styles.cta.padding}</span></div>
            <Slider value={[paddingToSlider(styles.cta.padding)]} onValueChange={([v]) => update("cta", "padding", sliderToPadding(v))} max={100} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><Label>Grosor borde</Label><span className="text-sm text-muted-foreground">{styles.cta.borderWidth}</span></div>
            <Slider value={[borderToSlider(styles.cta.borderWidth)]} onValueChange={([v]) => update("cta", "borderWidth", sliderToBorder(v))} max={100} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
