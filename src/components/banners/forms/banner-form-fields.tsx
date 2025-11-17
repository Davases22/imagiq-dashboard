"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BannerFormFieldsProps {
  formData: {
    name: string;
    placement: string;
    link_url: string;
    title: string;
    description: string;
    cta: string;
    color_font: string;
    coordinates: string;
    coordinates_mobile: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export function BannerFormFields({ formData, onFieldChange }: Readonly<BannerFormFieldsProps>) {
  // Ocultar color de fuente para navbar mobile
  const showColorFont = formData.placement !== "notification";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Banner *</Label>
          <Input
            id="name"
            placeholder="Ej: Promoción de verano"
            value={formData.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link_url">URL de Enlace</Label>
          <Input
            id="link_url"
            type="url"
            placeholder="https://ejemplo.com/producto"
            value={formData.link_url}
            onChange={(e) => onFieldChange("link_url", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cta">Llamado a la Acción</Label>
          <Input
            id="cta"
            placeholder="¡Compra ahora!"
            value={formData.cta}
            onChange={(e) => onFieldChange("cta", e.target.value)}
          />
        </div>

        {showColorFont && (
          <div className="space-y-2">
            <Label htmlFor="color_font">Color de Fuente</Label>
            <div className="flex gap-2">
              <Input
                id="color_font"
                type="color"
                value={formData.color_font}
                onChange={(e) => onFieldChange("color_font", e.target.value)}
                className="w-20"
              />
              <Input
                value={formData.color_font}
                onChange={(e) => onFieldChange("color_font", e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          placeholder="Título del banner"
          value={formData.title}
          onChange={(e) => onFieldChange("title", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Descripción del banner (usa Enter para saltos de línea)"
          value={formData.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          onKeyDown={(e) => {
            // Permitir Enter para saltos de línea
            if (e.key === "Enter") {
              e.stopPropagation();
            }
          }}
          rows={4}
          className="resize-y"
        />
      </div>
    </div>
  );
}
