"use client"

import { use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { LandingPageForm } from "@/components/landing-pages"

/**
 * Página de edición de Landing Page
 */
export default function EditarLandingPagePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const router = useRouter()
  const { id } = use(params)

  const handleCancel = useCallback(() => {
    router.push("/pagina-web/landing-pages")
  }, [router])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Editar Landing Page</h1>
          <p className="text-muted-foreground">
            Modifica la configuración de tu página dinámica
          </p>
        </div>
      </div>

      {/* Formulario unificado */}
      <LandingPageForm mode="edit" pageId={id} onCancel={handleCancel} />
    </div>
  )
}
