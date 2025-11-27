"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { LandingPageForm } from "@/components/landing-pages"
import { ProductCardsProvider } from "@/contexts/ProductCardsContext"

/**
 * Página de creación de nueva Landing Page dinámica
 */
export default function CrearLandingPagePage() {
  const router = useRouter()

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
          <h1 className="text-3xl font-bold tracking-tight">Nueva Landing Page</h1>
          <p className="text-muted-foreground">
            Crea una nueva página dinámica con banners, productos, FAQs y más
          </p>
        </div>
      </div>

      {/* Formulario unificado */}
      <ProductCardsProvider>
        <LandingPageForm mode="create" onCancel={handleCancel} />
      </ProductCardsProvider>
    </div>
  )
}
