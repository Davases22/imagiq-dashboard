"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
  disabled = false,
}: ProductCardFormFieldsProps) {
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
