"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { ProductCardTextStyles } from "@/types/product-card"

interface ProductCardTextStylesProps {
  textStyles: ProductCardTextStyles
  onChange: (styles: ProductCardTextStyles) => void
}

export function ProductCardTextStylesConfig({ textStyles, onChange }: ProductCardTextStylesProps) {
  const handleColorChange = (field: keyof ProductCardTextStyles, color: string) => {
    onChange({
      ...textStyles,
      [field]: {
        ...textStyles[field],
        color,
      },
    })
  }

  const handleCtaBackgroundChange = (backgroundColor: string) => {
    onChange({
      ...textStyles,
      cta: {
        ...textStyles.cta,
        backgroundColor,
      },
    })
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <h3 className="font-semibold text-sm">Colores de Texto</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Color del Título */}
        <div className="space-y-2">
          <Label htmlFor="title-color" className="text-xs">
            Color del Título
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="title-color"
              type="color"
              value={textStyles.title?.color || "#ffffff"}
              onChange={(e) => handleColorChange("title", e.target.value)}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={textStyles.title?.color || "#ffffff"}
              onChange={(e) => handleColorChange("title", e.target.value)}
              placeholder="#ffffff"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* Color del Subtítulo */}
        <div className="space-y-2">
          <Label htmlFor="subtitle-color" className="text-xs">
            Color del Subtítulo
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="subtitle-color"
              type="color"
              value={textStyles.subtitle?.color || "#ffffff"}
              onChange={(e) => handleColorChange("subtitle", e.target.value)}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={textStyles.subtitle?.color || "#ffffff"}
              onChange={(e) => handleColorChange("subtitle", e.target.value)}
              placeholder="#ffffff"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* Color de la Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description-color" className="text-xs">
            Color de la Descripción
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="description-color"
              type="color"
              value={textStyles.description?.color || "#ffffff"}
              onChange={(e) => handleColorChange("description", e.target.value)}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={textStyles.description?.color || "#ffffff"}
              onChange={(e) => handleColorChange("description", e.target.value)}
              placeholder="#ffffff"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* Color del CTA */}
        <div className="space-y-2">
          <Label htmlFor="cta-color" className="text-xs">
            Color del Texto del Botón
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="cta-color"
              type="color"
              value={textStyles.cta?.color || "#000000"}
              onChange={(e) => handleColorChange("cta", e.target.value)}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={textStyles.cta?.color || "#000000"}
              onChange={(e) => handleColorChange("cta", e.target.value)}
              placeholder="#000000"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* Color de fondo del CTA */}
        <div className="space-y-2">
          <Label htmlFor="cta-bg-color" className="text-xs">
            Color de Fondo del Botón
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="cta-bg-color"
              type="color"
              value={textStyles.cta?.backgroundColor || "#ffffff"}
              onChange={(e) => handleCtaBackgroundChange(e.target.value)}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={textStyles.cta?.backgroundColor || "#ffffff"}
              onChange={(e) => handleCtaBackgroundChange(e.target.value)}
              placeholder="#ffffff"
              className="flex-1 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        💡 Los colores se aplicarán a los textos y botón en la landing page. 
        Por defecto, textos son blancos y el botón tiene fondo blanco con texto negro.
      </p>
    </div>
  )
}
