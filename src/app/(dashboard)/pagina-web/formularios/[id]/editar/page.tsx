"use client"

import { use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { FormPageForm } from "@/components/form-pages"
import { ProductCardsProvider } from "@/contexts/ProductCardsContext"

/**
 * Página de edición de Formulario
 */
export default function EditarFormularioPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)

  const handleCancel = useCallback(() => {
    router.push("/pagina-web/formularios")
  }, [router])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Editar Formulario</h1>
            <p className="text-muted-foreground">
              Modifica la configuración del formulario y su landing page
            </p>
          </div>
        </div>
      </div>

      {/* Formulario unificado */}
      <ProductCardsProvider>
        <FormPageForm mode="edit" pageId={id} onCancel={handleCancel} />
      </ProductCardsProvider>
    </div>
  )
}
