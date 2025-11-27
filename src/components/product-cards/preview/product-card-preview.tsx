"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ProductCard } from "@/types/product-card"

interface ProductCardPreviewProps {
  productCard: ProductCard
  onEdit?: (productCard: ProductCard) => void
  onDelete?: (productCard: ProductCard) => void
  showActions?: boolean
}

export function ProductCardPreview({
  productCard,
  onEdit,
  onDelete,
  showActions = true,
}: ProductCardPreviewProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative aspect-square">
        <img
          src={productCard.image_url}
          alt={productCard.title}
          className="w-full h-full object-cover"
        />
        {showActions && (onEdit || onDelete) && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onEdit && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onEdit(productCard)}
              >
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onDelete(productCard)}
              >
                Eliminar
              </Button>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{productCard.title}</h3>

        {productCard.subtitle && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {productCard.subtitle}
          </p>
        )}

        {productCard.description && (
          <p className="text-sm line-clamp-2">{productCard.description}</p>
        )}

        {productCard.cta_text && productCard.cta_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            asChild
          >
            <a
              href={productCard.cta_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {productCard.cta_text}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
