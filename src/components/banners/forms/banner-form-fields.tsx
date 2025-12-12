"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BannerFormFieldsProps {
  formData: {
    name: string;
    placement: string;
    link_url: string;
    color_font: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export function BannerFormFields({ formData, onFieldChange }: Readonly<BannerFormFieldsProps>) {
  // Solo mostrar modo de header para banners de hero
  const isHeroBanner = formData.placement === "hero";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Banner *</Label>
        <Input
          id="name"
          placeholder="Ej: Promoción de verano"
          value={formData.name || ""}
          onChange={(e) => onFieldChange("name", e.target.value)}
        />
      </div>

      {isHeroBanner && (
        <div className="space-y-2">
          <Label htmlFor="header_mode">Modo del Header</Label>
          <select
            id="header_mode"
            value={formData.color_font || "#ffffff"}
            onChange={(e) => onFieldChange("color_font", e.target.value)}
            className="w-full text-sm border border-input bg-background dark:bg-input/30 rounded-md px-3 py-2 focus:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            <option value="#ffffff">Claro (header blanco)</option>
            <option value="#000000">Oscuro (header negro)</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Define el color del header que se mostrará sobre este banner hero
          </p>
        </div>
      )}
    </div>
  );
}
