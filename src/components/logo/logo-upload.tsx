"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { useRef } from "react"

interface LogoUploadProps {
  name: "header-logo-dark" | "header-logo-light" | "favicon"
  imagePreview: string | null
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  isUploading?: boolean
  disabled?: boolean
  recommendedSize: string
  description: string
}

export function LogoUpload({
  name,
  imagePreview,
  onImageChange,
  onRemoveImage,
  isUploading = false,
  disabled = false,
  recommendedSize,
  description,
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChangeClick = () => {
    fileInputRef.current?.click()
  }

  const getLabelText = () => {
    if (name === "header-logo-dark") return "Logo Oscuro"
    if (name === "header-logo-light") return "Logo Claro"
    return "Favicon"
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${name}-upload`} className="text-base font-semibold">
        {getLabelText()}
      </Label>
      <p className="text-xs text-muted-foreground">
        {description}
      </p>
      <p className="text-xs font-medium text-primary">
        Tamaño recomendado: {recommendedSize}
      </p>

      {imagePreview ? (
        <div className="relative w-full max-w-xs mx-auto">
          <div className={`relative ${name === "favicon" ? "w-32 h-32" : "w-full aspect-square"} mx-auto`}>
            <img
              src={imagePreview}
              alt={name === "favicon" ? "Favicon Preview" : "Logo Preview"}
              className="w-full h-full object-contain rounded-lg border bg-white p-2"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleChangeClick}
              disabled={disabled || isUploading}
              title="Cambiar imagen"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={onRemoveImage}
              disabled={disabled || isUploading}
              title="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon"
            className="hidden"
            onChange={onImageChange}
            disabled={disabled || isUploading}
          />
        </div>
      ) : (
        <div className="relative">
          <Label
            htmlFor={`${name}-upload`}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-accent/50 transition-colors ${
              name === "favicon" ? "w-32 h-32 mx-auto" : "aspect-square max-w-xs mx-auto"
            } ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isUploading ? (
              <Loader2 className="h-10 w-10 mb-3 animate-spin text-primary" />
            ) : (
              <Upload className="h-10 w-10 mb-3 text-muted-foreground" />
            )}
            <span className="text-sm text-primary hover:underline font-medium text-center">
              {isUploading ? "Subiendo..." : "Click para seleccionar"}
            </span>
          </Label>
          <Input
            id={`${name}-upload`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon"
            className="hidden"
            onChange={onImageChange}
            disabled={disabled || isUploading}
          />
        </div>
      )}
    </div>
  )
}
