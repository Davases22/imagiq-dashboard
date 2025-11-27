"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useProductCards } from "@/hooks/use-product-cards"
import { ProductCardFormDialog } from "./forms/product-card-form-dialog"
import { ProductCardPreview } from "./preview/product-card-preview"
import type { ProductCard } from "@/types/product-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProductCardsManagerProps {
  pageId?: string
}

export function ProductCardsManager({ pageId }: ProductCardsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<ProductCard | null>(null)
  const [deletingCard, setDeletingCard] = useState<ProductCard | null>(null)

  const {
    productCards,
    isLoading,
    error,
    createProductCard,
    updateProductCard,
    deleteProductCard,
  } = useProductCards({ pageId, autoFetch: !!pageId })

  const handleCreate = async (formData: FormData) => {
    if (pageId) {
      formData.append("page_id", pageId)
    }

    const result = await createProductCard(formData)

    if (result) {
      toast.success("Product Card creado exitosamente")
      return result
    }

    toast.error("Error al crear Product Card")
    return null
  }

  const handleUpdate = async (formData: FormData) => {
    if (!editingCard) return null

    const result = await updateProductCard(editingCard.id, formData)

    if (result) {
      toast.success("Product Card actualizado exitosamente")
      setEditingCard(null)
      return result
    }

    toast.error("Error al actualizar Product Card")
    return null
  }

  const handleDelete = async () => {
    if (!deletingCard) return

    const success = await deleteProductCard(deletingCard.id)

    if (success) {
      toast.success("Product Card eliminado exitosamente")
    } else {
      toast.error("Error al eliminar Product Card")
    }

    setDeletingCard(null)
  }

  const handleOpenCreate = () => {
    setEditingCard(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (card: ProductCard) => {
    setEditingCard(card)
    setDialogOpen(true)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive text-center">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Cards</CardTitle>
            <Button type="button" onClick={handleOpenCreate} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && productCards.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : productCards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No hay productos agregados todavía
              </p>
              <Button type="button" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Producto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {productCards.map((card) => (
                <ProductCardPreview
                  key={card.id}
                  productCard={card}
                  onEdit={handleOpenEdit}
                  onDelete={setDeletingCard}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar */}
      <ProductCardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={editingCard ? handleUpdate : handleCreate}
        productCard={editingCard}
        isLoading={isLoading}
      />

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!deletingCard} onOpenChange={() => setDeletingCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              product card "{deletingCard?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
