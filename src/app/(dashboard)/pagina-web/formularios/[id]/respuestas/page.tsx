"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { SubmissionsViewer } from "@/components/form-submissions/submissions-viewer"

/**
 * Página de visualización de respuestas del formulario
 */
export default function RespuestasFormularioPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/pagina-web/formularios")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Respuestas del Formulario</h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona las respuestas recibidas
          </p>
        </div>
      </div>

      {/* Visor de respuestas */}
      <SubmissionsViewer pageId={id} />
    </div>
  )
}
