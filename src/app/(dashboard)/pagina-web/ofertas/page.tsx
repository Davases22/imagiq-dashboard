"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useOfertas } from "@/hooks/use-ofertas"
import {
  OfertasStats,
  OfertasTable,
  DeleteOfertaDialog,
  EmptyOfertasState,
} from "@/components/ofertas"

interface Oferta {
  id: string
  titulo: string
  descripcion?: string
  descuento: number
  tipoDescuento: "porcentaje" | "monto"
  fechaInicio: string
  fechaFin: string
  isActive: boolean
  categorias?: string[]
  productos?: string[]
  createdAt: string
  updatedAt: string
}

export default function OfertasPage() {
  const router = useRouter()
  const { ofertas, loading, toggleOfertaActive, deleteOferta } = useOfertas()
  const [deletingOferta, setDeletingOferta] = useState<Oferta | null>(null)

  const handleDeleteConfirm = () => {
    if (deletingOferta) {
      deleteOferta(deletingOferta.id)
      setDeletingOferta(null)
    }
  }

  const handleCreateClick = () => {
    router.push("/pagina-web/ofertas/crear")
  }

  const handleEdit = (id: string) => {
    router.push(`/pagina-web/ofertas/${id}/editar`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Page Ofertas</h1>
          <p className="text-muted-foreground">
            Gestiona las ofertas especiales y promociones de tu sitio web
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Oferta
        </Button>
      </div>

      <OfertasStats ofertas={ofertas} />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Ofertas</CardTitle>
          <CardDescription>
            Gestiona todas las ofertas y promociones de tu tienda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando ofertas...
            </div>
          ) : ofertas.length === 0 ? (
            <EmptyOfertasState onCreateClick={handleCreateClick} />
          ) : (
            <OfertasTable
              ofertas={ofertas}
              onToggleActive={toggleOfertaActive}
              onEdit={handleEdit}
              onDelete={setDeletingOferta}
            />
          )}
        </CardContent>
      </Card>

      <DeleteOfertaDialog
        oferta={deletingOferta}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingOferta(null)}
      />
    </div>
  )
}
