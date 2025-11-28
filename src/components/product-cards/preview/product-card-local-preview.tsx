"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, GripVertical } from "lucide-react"
import type { LocalProductCard } from "@/contexts/ProductCardsContext"
import { useMemo } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: productCard.tempId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
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
    <Card
      ref={setNodeRef}
      style={style}
      className="overflow-hidden flex flex-col h-full relative"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-background/80 backdrop-blur-sm rounded p-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Imagen */}
      {imagePreviewUrl && (
        <div className="relative aspect-square bg-muted flex-shrink-0">
          <img
            src={imagePreviewUrl}
            alt={productCard.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Contenido con flex-grow para empujar botones al fondo */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="space-y-2 flex-grow">
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
        </div>

        {/* Acciones siempre al fondo */}
        <div className="flex gap-2 pt-3 mt-3 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(productCard)}
            className="flex-1 h-9"
          >
            <Edit className="h-4 w-4 mr-1.5" />
            <span className="sm:hidden">Edit</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(productCard)}
            className="flex-1 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            <span className="sm:hidden">Del</span>
          </Button>
        </div>
      </div>
    </Card>
  )
}
