"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon } from "lucide-react"
import { useRef } from "react"

interface ProductCardImageUploadProps {
  imagePreview: string | null
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  isRequired?: boolean
  disabled?: boolean
}

export function ProductCardImageUpload({
  imagePreview,
  onImageChange,
  onRemoveImage,
  isRequired = false,
  disabled = false,
}: ProductCardImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChangeClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="image">
        Imagen {isRequired && <span className="text-destructive">*</span>}
      </Label>
      <p className="text-xs text-muted-foreground">
        La imagen debe ser cuadrada (1:1). Formato: JPG, PNG o WebP. Máximo 5MB.
      </p>

      {imagePreview ? (
        <div className="relative w-full max-w-xs mx-auto">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full aspect-square object-cover rounded-lg border"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleChangeClick}
              disabled={disabled}
              title="Cambiar imagen"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={onRemoveImage}
              disabled={disabled}
              title="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImageChange}
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="relative">
          <Label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-accent/50 transition-colors aspect-square max-w-xs mx-auto"
          >
            <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
            <span className="text-sm text-primary hover:underline font-medium">
              Click para seleccionar imagen
            </span>
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onImageChange}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}
