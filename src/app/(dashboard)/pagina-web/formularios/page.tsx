"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useFormPages } from "@/hooks/use-form-pages"
import {
  FormPagesStats,
  FormPagesTable,
} from "@/components/form-pages"
import { PagesPagination } from "@/components/landing-pages/pages-pagination"
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
import type { Page } from "@/types/page"

/**
 * Página principal de gestión de Formularios
 *
 * Características:
 * - Lista todos los formularios con paginación
 * - Filtros por título
 * - Ordenamiento por columnas
 * - Acciones: crear, editar, ver respuestas, eliminar, toggle activo
 * - Estadísticas generales
 *
 * Paginación:
 * - Tamaños: 5, 10 (default), 15, 20 items por página
 * - Navegación: Anterior/Siguiente
 */
export default function FormulariosPage() {
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
  } = useFormPages()

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
   * Navegar a crear nuevo formulario
   */
  const handleCreateClick = () => {
    router.push("/pagina-web/formularios/crear")
  }

  /**
   * Navegar a editar formulario
   */
  const handleEdit = (id: string) => {
    router.push(`/pagina-web/formularios/${id}/editar`)
  }

  /**
   * Navegar a ver respuestas
   */
  const handleViewResponses = (id: string) => {
    router.push(`/pagina-web/formularios/${id}/respuestas`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formularios</h1>
          <p className="text-muted-foreground">
            Crea landing pages con formularios de captura de leads, contacto y encuestas
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Formulario
        </Button>
      </div>

      {/* Estadísticas */}
      <FormPagesStats pages={pages} />

      {/* Tabla con paginación */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Formularios</CardTitle>
          <CardDescription>
            Gestiona todos los formularios de captura de tu sitio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando formularios...
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No hay formularios creados todavía
              </p>
              <Button onClick={handleCreateClick}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Formulario
              </Button>
            </div>
          ) : (
            <>
              <FormPagesTable
                pages={pages}
                onToggleActive={togglePageActive}
                onEdit={handleEdit}
                onViewResponses={handleViewResponses}
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
      <AlertDialog open={!!deletingPage} onOpenChange={(open) => !open && setDeletingPage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el formulario &quot;{deletingPage?.title}&quot;?
              Esta acción no se puede deshacer y se perderán todas las respuestas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPage(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
