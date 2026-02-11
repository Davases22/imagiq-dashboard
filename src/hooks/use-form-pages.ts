"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { pageEndpoints } from "@/lib/api"
import type { Page } from "@/types/page"
import type { PaginationState } from "@/types/landing-page"
import { DEFAULT_PAGE_SIZE } from "@/types/landing-page"

/**
 * Resultado del hook useFormPages
 */
interface UseFormPagesResult {
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
interface UseFormPagesOptions {
  initialPage?: number
  initialPageSize?: number
  autoFetch?: boolean
}

/**
 * Hook para manejar el listado de formularios con paginación
 *
 * Características:
 * - Filtra páginas con page_type='form' del lado del cliente
 * - Paginación del lado del cliente
 * - Control de tamaño de página (5, 10, 15, 20)
 * - Navegación entre páginas
 * - Toggle de estado activo/inactivo
 * - Eliminación de páginas
 * - Manejo de loading y errores
 *
 * @example
 * const { pages, pagination, goToPage, setPageSize } = useFormPages()
 */
export function useFormPages(options: UseFormPagesOptions = {}): UseFormPagesResult {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    autoFetch = true,
  } = options

  // Estado de las páginas
  const [allPages, setAllPages] = useState<Page[]>([])
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
   * Fetch páginas desde el API y filtrar por page_type='form'
   */
  const fetchPages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Llamada al endpoint sin paginación (traemos todas)
      const response = await pageEndpoints.getAll({
        page: 1,
        limit: 1000, // Traer todas para filtrar
      })

      if (response.success && response.data) {
        const { data } = response.data

        // Filtrar solo las páginas de tipo 'form'
        const formPages = (data || []).filter((page) => page.page_type === "form")
        setAllPages(formPages)
      } else {
        throw new Error(response.message || "Error al cargar formularios")
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido al cargar formularios"
      setError(errorMessage)
      setAllPages([])
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Aplicar paginación del lado del cliente
   */
  useEffect(() => {
    const total = allPages.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize

    setPages(allPages.slice(start, end))
    setPagination({
      currentPage,
      pageSize,
      totalPages,
      total,
    })
  }, [allPages, currentPage, pageSize])

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
    await fetchPages()
  }, [fetchPages])

  /**
   * Toggle estado activo/inactivo de una página
   */
  const togglePageActive = useCallback(
    async (page: Page) => {
      try {
        // TODO: Implementar endpoint de actualización cuando esté disponible
        // await pageEndpoints.updateStatus(page.id, { is_active: !page.is_active })

        // Por ahora actualiza localmente
        setAllPages((prev) =>
          prev.map((p) =>
            p.id === page.id ? { ...p, is_active: !p.is_active } : p
          )
        )

        toast.success(
          `Formulario ${!page.is_active ? "activado" : "desactivado"} exitosamente`
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
          toast.success("Formulario eliminado exitosamente")

          // Si era la última página del listado, ir a la página anterior
          if (pages.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1)
          }

          // Recargar las páginas
          await refetch()
        } else {
          throw new Error("Error al eliminar el formulario")
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al eliminar formulario"
        toast.error(errorMessage)
      }
    },
    [pages.length, currentPage, refetch]
  )

  /**
   * Fetch automático cuando se monta el componente
   */
  useEffect(() => {
    if (autoFetch) {
      fetchPages()
    }
  }, [autoFetch, fetchPages])

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
