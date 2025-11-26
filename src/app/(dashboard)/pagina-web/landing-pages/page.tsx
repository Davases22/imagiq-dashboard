"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { usePages } from "@/hooks/use-pages"
import {
  PagesStats,
  PagesTable,
  DeletePageDialog,
  EmptyPagesState,
  PagesPagination,
} from "@/components/landing-pages"
import type { Page } from "@/types/page"

/**
 * Página principal de gestión de Landing Pages dinámicas
 *
 * Características:
 * - Lista todas las landing pages con paginación
 * - Filtros por fecha de creación y vigencia
 * - Ordenamiento por columnas
 * - Acciones: crear, editar, eliminar, toggle activo
 * - Estadísticas generales
 *
 * Paginación:
 * - Tamaños: 5, 10 (default), 15, 20 items por página
 * - Navegación: Anterior/Siguiente
 */
export default function LandingPagesPage() {
  const router = useRouter()

  // Hook principal con paginación
  const {
    pages,
    isLoading,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    togglePageActive,
    deletePage,
  } = usePages()

  // Estado local para el diálogo de eliminación
  const [deletingPage, setDeletingPage] = useState<Page | null>(null)

  /**
   * Confirmar eliminación de página
   */
  const handleDeleteConfirm = async () => {
    if (deletingPage) {
      await deletePage(deletingPage.id)
      setDeletingPage(null)
    }
  }

  /**
   * Navegar a crear nueva página
   */
  const handleCreateClick = () => {
    router.push("/pagina-web/landing-pages/crear")
  }

  /**
   * Navegar a editar página
   */
  const handleEdit = (id: string) => {
    router.push(`/pagina-web/landing-pages/${id}/editar`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Páginas Dinámicas</h1>
          <p className="text-muted-foreground">
            Gestiona las landing pages de tu sitio web: ofertas, promociones, eventos y más
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Página
        </Button>
      </div>

      {/* Estadísticas */}
      <PagesStats pages={pages} />

      {/* Tabla con paginación */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Páginas</CardTitle>
          <CardDescription>
            Gestiona todas las landing pages dinámicas de tu sitio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando páginas...
            </div>
          ) : pages.length === 0 ? (
            <EmptyPagesState onCreateClick={handleCreateClick} />
          ) : (
            <>
              <PagesTable
                pages={pages}
                onToggleActive={togglePageActive}
                onEdit={handleEdit}
                onDelete={setDeletingPage}
              />

              {/* Controles de paginación */}
              <PagesPagination
                pagination={pagination}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
                onNextPage={nextPage}
                onPreviousPage={previousPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de eliminación */}
      <DeletePageDialog
        page={deletingPage}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPage(null)}
      />
    </div>
  )
}
