"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProductCardTextStyles } from "@/types/product-card"

interface ProductCardFormFieldsProps {
  title: string
  subtitle: string
  description: string
  ctaText: string
  ctaUrl: string
  onTitleChange: (value: string) => void
  onSubtitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onCtaTextChange: (value: string) => void
  onCtaUrlChange: (value: string) => void
  textStyles: ProductCardTextStyles
  onTextStylesChange: (styles: ProductCardTextStyles) => void
  disabled?: boolean
}

export function ProductCardFormFields({
  title,
  subtitle,
  description,
  ctaText,
  ctaUrl,
  onTitleChange,
  onSubtitleChange,
  onDescriptionChange,
  onCtaTextChange,
  onCtaUrlChange,
  textStyles,
  onTextStylesChange,
  disabled = false,
}: ProductCardFormFieldsProps) {
  const handleColorChange = (field: keyof ProductCardTextStyles, color: string) => {
    onTextStylesChange({
      ...textStyles,
      [field]: {
        ...textStyles[field],
        color,
      },
    })
  }

  const handleCtaBackgroundChange = (backgroundColor: string) => {
    onTextStylesChange({
      ...textStyles,
      cta: {
        ...textStyles.cta,
        backgroundColor,
      },
    })
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Nombre del producto"
          maxLength={255}
          required
          disabled={disabled}
        />
        {/* Color del título */}
        <div className="flex gap-2 items-center pt-1">
          <Label htmlFor="title-color" className="text-xs text-muted-foreground whitespace-nowrap">
            Color:
          </Label>
          <Input
            id="title-color"
            type="color"
            value={textStyles.title?.color || "#ffffff"}
            onChange={(e) => handleColorChange("title", e.target.value)}
            className="h-8 w-16 cursor-pointer"
            disabled={disabled}
          />
          <Input
            type="text"
            value={textStyles.title?.color || "#ffffff"}
            onChange={(e) => handleColorChange("title", e.target.value)}
            placeholder="#ffffff"
            className="flex-1 h-8 font-mono text-xs"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          placeholder="Categoría o característica destacada"
          maxLength={500}
          disabled={disabled}
        />
        {/* Color del subtítulo */}
        <div className="flex gap-2 items-center pt-1">
          <Label htmlFor="subtitle-color" className="text-xs text-muted-foreground whitespace-nowrap">
            Color:
          </Label>
          <Input
            id="subtitle-color"
            type="color"
            value={textStyles.subtitle?.color || "#ffffff"}
            onChange={(e) => handleColorChange("subtitle", e.target.value)}
            className="h-8 w-16 cursor-pointer"
            disabled={disabled}
          />
          <Input
            type="text"
            value={textStyles.subtitle?.color || "#ffffff"}
            onChange={(e) => handleColorChange("subtitle", e.target.value)}
            placeholder="#ffffff"
            className="flex-1 h-8 font-mono text-xs"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Descripción del producto"
          rows={3}
          disabled={disabled}
        />
        {/* Color de la descripción */}
        <div className="flex gap-2 items-center pt-1">
          <Label htmlFor="description-color" className="text-xs text-muted-foreground whitespace-nowrap">
            Color:
          </Label>
          <Input
            id="description-color"
            type="color"
            value={textStyles.description?.color || "#ffffff"}
            onChange={(e) => handleColorChange("description", e.target.value)}
            className="h-8 w-16 cursor-pointer"
            disabled={disabled}
          />
          <Input
            type="text"
            value={textStyles.description?.color || "#ffffff"}
            onChange={(e) => handleColorChange("description", e.target.value)}
            placeholder="#ffffff"
            className="flex-1 h-8 font-mono text-xs"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cta-text">Texto del Botón (opcional)</Label>
        <Input
          id="cta-text"
          value={ctaText}
          onChange={(e) => onCtaTextChange(e.target.value)}
          placeholder="Ver más, Comprar ahora, etc."
          maxLength={100}
          disabled={disabled}
        />
        {/* Color del texto del botón */}
        <div className="flex gap-2 items-center pt-1">
          <Label htmlFor="cta-text-color" className="text-xs text-muted-foreground whitespace-nowrap">
            Color texto:
          </Label>
          <Input
            id="cta-text-color"
            type="color"
            value={textStyles.cta?.color || "#000000"}
            onChange={(e) => handleColorChange("cta", e.target.value)}
            className="h-8 w-16 cursor-pointer"
            disabled={disabled}
          />
          <Input
            type="text"
            value={textStyles.cta?.color || "#000000"}
            onChange={(e) => handleColorChange("cta", e.target.value)}
            placeholder="#000000"
            className="flex-1 h-8 font-mono text-xs"
            disabled={disabled}
          />
        </div>
        {/* Color de fondo del botón */}
        <div className="flex gap-2 items-center pt-1">
          <Label htmlFor="cta-bg-color" className="text-xs text-muted-foreground whitespace-nowrap">
            Color fondo:
          </Label>
          <Input
            id="cta-bg-color"
            type="color"
            value={textStyles.cta?.backgroundColor || "#ffffff"}
            onChange={(e) => handleCtaBackgroundChange(e.target.value)}
            className="h-8 w-16 cursor-pointer"
            disabled={disabled}
          />
          <Input
            type="text"
            value={textStyles.cta?.backgroundColor || "#ffffff"}
            onChange={(e) => handleCtaBackgroundChange(e.target.value)}
            placeholder="#ffffff"
            className="flex-1 h-8 font-mono text-xs"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cta-url">URL del Botón (opcional)</Label>
        <Input
          id="cta-url"
          type="url"
          value={ctaUrl}
          onChange={(e) => onCtaUrlChange(e.target.value)}
          placeholder="https://..."
          disabled={disabled}
        />
      </div>
    </>
  )
}
