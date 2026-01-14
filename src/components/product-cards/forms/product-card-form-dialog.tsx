"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ProductCardImageUpload } from "./product-card-image-upload"
import { ProductCardFormFields } from "./product-card-form-fields"
import type { ProductCard, ProductCardTextStyles } from "@/types/product-card"

interface ProductCardFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (formData: FormData) => Promise<ProductCard | null>
  productCard?: ProductCard | null
  isLoading?: boolean
}

export function ProductCardFormDialog({
  open,
  onOpenChange,
  onSubmit,
  productCard,
  isLoading = false,
}: ProductCardFormDialogProps) {
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [description, setDescription] = useState("")
  const [ctaText, setCtaText] = useState("")
  const [ctaUrl, setCtaUrl] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [textStyles, setTextStyles] = useState<ProductCardTextStyles>({
    title: { color: "#ffffff" },
    subtitle: { color: "#ffffff" },
    description: { color: "#ffffff" },
    cta: { color: "#000000", backgroundColor: "#ffffff" },
  })

  useEffect(() => {
    if (productCard) {
      setTitle(productCard.title || "")
      setSubtitle(productCard.subtitle || "")
      setDescription(productCard.description || "")
      setCtaText(productCard.cta_text || "")
      setCtaUrl(productCard.cta_url || "")
      setImagePreview(productCard.image_url || null)
      setImage(null)
      
      // Cargar text_styles si existen
      if (productCard.text_styles) {
        setTextStyles({
          title: productCard.text_styles.title || { color: "#ffffff" },
          subtitle: productCard.text_styles.subtitle || { color: "#ffffff" },
          description: productCard.text_styles.description || { color: "#ffffff" },
          cta: productCard.text_styles.cta || { color: "#000000", backgroundColor: "#ffffff" },
        })
      } else {
        setTextStyles({
          title: { color: "#ffffff" },
          subtitle: { color: "#ffffff" },
          description: { color: "#ffffff" },
          cta: { color: "#000000", backgroundColor: "#ffffff" },
        })
      }
    } else {
      setTitle("")
      setSubtitle("")
      setDescription("")
      setCtaText("")
      setCtaUrl("")
      setImage(null)
      setImagePreview(null)
      setTextStyles({
        title: { color: "#ffffff" },
        subtitle: { color: "#ffffff" },
        description: { color: "#ffffff" },
        cta: { color: "#000000", backgroundColor: "#ffffff" },
      })
    }
  }, [productCard, open])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen válido")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB")
      return
    }

    setImage(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmitForm = async (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!title.trim()) {
      toast.error("El título es requerido")
      return
    }

    if (!productCard && !image) {
      toast.error("La imagen es requerida")
      return
    }

    const formData = new FormData()
    formData.append("title", title.trim())

    if (subtitle.trim()) formData.append("subtitle", subtitle.trim())
    if (description.trim()) formData.append("description", description.trim())
    if (ctaText.trim()) formData.append("cta_text", ctaText.trim())
    if (ctaUrl.trim()) formData.append("cta_url", ctaUrl.trim())
    if (image) formData.append("image", image)

    // Agregar text_styles como JSON string
    formData.append("text_styles", JSON.stringify(textStyles))

    formData.append("status", "active")

    const result = await onSubmit(formData)

    if (result !== null) {
      onOpenChange(false)
    }
  }

  const isEditMode = Boolean(productCard)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Product Card" : "Crear Product Card"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ProductCardImageUpload
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onRemoveImage={handleRemoveImage}
            isRequired={!isEditMode}
            disabled={isLoading}
          />

          <ProductCardFormFields
            title={title}
            subtitle={subtitle}
            description={description}
            ctaText={ctaText}
            ctaUrl={ctaUrl}
            onTitleChange={setTitle}
            onSubtitleChange={setSubtitle}
            onDescriptionChange={setDescription}
            onCtaTextChange={setCtaText}
            onCtaUrlChange={setCtaUrl}
            textStyles={textStyles}
            onTextStylesChange={setTextStyles}
            disabled={isLoading}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => handleSubmitForm()} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>{isEditMode ? "Actualizar" : "Crear"}</>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
