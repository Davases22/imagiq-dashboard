"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

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
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onRemoveImage}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <Label htmlFor="image-upload" className="cursor-pointer">
            <span className="text-sm text-primary hover:underline">
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
