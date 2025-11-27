"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import type { LocalProductCard } from "@/contexts/ProductCardsContext"
import { useMemo } from "react"

interface ProductCardLocalPreviewProps {
  productCard: LocalProductCard
  onEdit: (card: LocalProductCard) => void
  onDelete: (card: LocalProductCard) => void
}

export function ProductCardLocalPreview({
  productCard,
  onEdit,
  onDelete,
}: ProductCardLocalPreviewProps) {
  // Crear URL temporal para preview de la imagen
  const imagePreviewUrl = useMemo(() => {
    if (productCard.image_url) {
      return productCard.image_url
    }
    if (productCard.image) {
      return URL.createObjectURL(productCard.image)
    }
    return null
  }, [productCard.image, productCard.image_url])

  // Cleanup de la URL temporal
  useMemo(() => {
    return () => {
      if (imagePreviewUrl && productCard.image) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl, productCard.image])

  return (
    <Card className="overflow-hidden">
      {/* Imagen */}
      {imagePreviewUrl && (
        <div className="relative aspect-square bg-muted">
          <img
            src={imagePreviewUrl}
            alt={productCard.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-2">{productCard.title}</h3>

        {productCard.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {productCard.subtitle}
          </p>
        )}

        {productCard.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {productCard.description}
          </p>
        )}

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(productCard)}
            className="flex-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete(productCard)}
            className="flex-1"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  )
}
