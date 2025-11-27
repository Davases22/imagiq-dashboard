"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useProductCardsContext, type LocalProductCard } from "@/contexts/ProductCardsContext"
import { ProductCardFormDialog } from "./forms/product-card-form-dialog"
import { ProductCardLocalPreview } from "./preview/product-card-local-preview"
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

interface ProductCardsLocalManagerProps {
  sectionId: string
}

export function ProductCardsLocalManager({ sectionId }: ProductCardsLocalManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<LocalProductCard | null>(null)
  const [deletingCard, setDeletingCard] = useState<LocalProductCard | null>(null)

  const { getCardsBySection, addProductCard, updateProductCard, deleteProductCard } =
    useProductCardsContext()

  const sectionCards = getCardsBySection(sectionId)

  const handleCreate = async (formData: FormData) => {
    // Extraer datos del FormData
    const image = formData.get("image") as File | null
    const title = formData.get("title") as string
    const subtitle = formData.get("subtitle") as string
    const description = formData.get("description") as string
    const cta_text = formData.get("cta_text") as string
    const cta_url = formData.get("cta_url") as string

    const newCard = {
      sectionId,
      image: image || undefined, // Convertir null a undefined
      title,
      subtitle: subtitle || undefined,
      description: description || undefined,
      cta_text: cta_text || undefined,
      cta_url: cta_url || undefined,
    }

    addProductCard(newCard)
    toast.success("Product Card agregado")
    setDialogOpen(false)
    return null // No retornamos ProductCard porque es local
  }

  const handleUpdate = async (formData: FormData) => {
    if (!editingCard) return null

    const image = formData.get("image") as File | null
    const title = formData.get("title") as string
    const subtitle = formData.get("subtitle") as string
    const description = formData.get("description") as string
    const cta_text = formData.get("cta_text") as string
    const cta_url = formData.get("cta_url") as string

    updateProductCard(editingCard.tempId, {
      image: image || editingCard.image,
      title,
      subtitle: subtitle || undefined,
      description: description || undefined,
      cta_text: cta_text || undefined,
      cta_url: cta_url || undefined,
    })

    toast.success("Product Card actualizado")
    setEditingCard(null)
    setDialogOpen(false)
    return null // No retornamos ProductCard porque es local
  }

  const handleDelete = () => {
    if (!deletingCard) return

    deleteProductCard(deletingCard.tempId)
    toast.success("Product Card eliminado")
    setDeletingCard(null)
  }

  const handleOpenCreate = () => {
    setEditingCard(null)
    setDialogOpen(true)
  }

  const handleOpenEdit = (card: LocalProductCard) => {
    setEditingCard(card)
    setDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Cards</CardTitle>
            <Button type="button" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {sectionCards.length === 0 ? (
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
              {sectionCards.map((card) => (
                <ProductCardLocalPreview
                  key={card.tempId}
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
        productCard={editingCard ? {
          id: editingCard.tempId,
          image_url: editingCard.image_url || '',
          title: editingCard.title,
          subtitle: editingCard.subtitle || null,
          description: editingCard.description || null,
          cta_text: editingCard.cta_text || null,
          cta_url: editingCard.cta_url || null,
          content_position: editingCard.content_position || null,
          text_styles: editingCard.text_styles || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
          page_id: null,
        } : null}
        isLoading={false}
      />

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={!!deletingCard} onOpenChange={() => setDeletingCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el product card "{deletingCard?.title}".
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
