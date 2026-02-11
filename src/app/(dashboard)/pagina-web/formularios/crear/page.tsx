"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { FormPageForm } from "@/components/form-pages"
import { ProductCardsProvider } from "@/contexts/ProductCardsContext"

/**
 * Página de creación de nuevo Formulario
 */
export default function CrearFormularioPage() {
  const router = useRouter()

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
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Formulario</h1>
            <p className="text-muted-foreground">
              Crea una landing page con formulario de captura de leads, contacto o encuesta
            </p>
          </div>
        </div>
      </div>

      {/* Formulario unificado */}
      <ProductCardsProvider>
        <FormPageForm mode="create" onCancel={handleCancel} />
      </ProductCardsProvider>
    </div>
  )
}
