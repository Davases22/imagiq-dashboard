"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { pageEndpoints } from "@/lib/api"
import type { Page } from "@/types/page"
import type { PaginationState } from "@/types/landing-page"
import { DEFAULT_PAGE_SIZE } from "@/types/landing-page"

/**
 * Resultado del hook usePages
 */
interface UsePagesResult {
  pages: Page[]
  isLoading: boolean
  error: string | null
  pagination: PaginationState
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  setPageSize: (size: number) => void
  togglePageActive: (page: Page) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  refetch: () => Promise<void>
}

/**
 * Opciones para configurar el hook
 */
interface UsePagesOptions {
  initialPage?: number
  initialPageSize?: number
  autoFetch?: boolean
}

/**
 * Hook para manejar el listado de landing pages con paginación
 *
 * Características:
 * - Paginación del lado del servidor
 * - Control de tamaño de página (5, 10, 15, 20)
 * - Navegación entre páginas
 * - Toggle de estado activo/inactivo
 * - Eliminación de páginas
 * - Manejo de loading y errores
 *
 * @example
 * const { pages, pagination, goToPage, setPageSize } = usePages()
 */
export function usePages(options: UsePagesOptions = {}): UsePagesResult {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    autoFetch = true,
  } = options

  // Estado de las páginas
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize)
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalPages: 0,
    total: 0,
  })

  /**
   * Fetch páginas desde el API con paginación
   */
  const fetchPages = useCallback(
    async (page: number, limit: number) => {
      setIsLoading(true)
      setError(null)

      try {
        // Llamada al endpoint real sin filtros de estado
        // Trae TODAS las páginas sin importar su status
        const response = await pageEndpoints.getAll({
          page,
          limit,
        })

        if (response.success && response.data) {
          const { data, meta } = response.data

          setPages(data || [])
          setPagination({
            currentPage: meta.page,
            pageSize: meta.limit,
            totalPages: meta.totalPages,
            total: meta.total,
          })
        } else {
          throw new Error(response.message || "Error al cargar páginas")
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido al cargar páginas"
        setError(errorMessage)
        setPages([])
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Navegar a una página específica
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > pagination.totalPages) return
      setCurrentPage(page)
    },
    [pagination.totalPages]
  )

  /**
   * Navegar a la página siguiente
   */
  const nextPage = useCallback(() => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, pagination.totalPages])

  /**
   * Navegar a la página anterior
   */
  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  /**
   * Cambiar el tamaño de página
   * Resetea a la página 1 cuando cambia el tamaño
   */
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setCurrentPage(1) // Volver a la primera página
  }, [])

  /**
   * Refetch manual de las páginas
   */
  const refetch = useCallback(async () => {
    await fetchPages(currentPage, pageSize)
  }, [currentPage, pageSize, fetchPages])

  /**
   * Toggle estado activo/inactivo de una página
   */
  const togglePageActive = useCallback(
    async (page: Page) => {
      try {
        // TODO: Implementar endpoint de actualización cuando esté disponible
        // await pageEndpoints.updateStatus(page.id, { is_active: !page.is_active })

        // Por ahora actualiza localmente
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id ? { ...p, is_active: !p.is_active } : p
          )
        )

        toast.success(
          `Página ${!page.is_active ? "activada" : "desactivada"} exitosamente`
        )
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al actualizar estado"
        toast.error(errorMessage)
      }
    },
    []
  )

  /**
   * Eliminar una página
   */
  const deletePage = useCallback(
    async (pageId: string) => {
      try {
        // Llamar al endpoint de eliminación del backend
        const response = await pageEndpoints.delete(pageId)

        if (response.success) {
          toast.success("Página eliminada exitosamente")

          // Si era la última página del listado, ir a la página anterior
          if (pages.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1)
          } else {
            // Recargar la página actual para reflejar los cambios
            await refetch()
          }
        } else {
          throw new Error("Error al eliminar la página")
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al eliminar página"
        toast.error(errorMessage)
      }
    },
    [pages.length, currentPage, refetch]
  )

  /**
   * Fetch automático cuando cambia página o tamaño
   */
  useEffect(() => {
    if (autoFetch) {
      fetchPages(currentPage, pageSize)
    }
  }, [currentPage, pageSize, autoFetch, fetchPages])

  return {
    pages,
    isLoading,
    error,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    togglePageActive,
    deletePage,
    refetch,
  }
}
