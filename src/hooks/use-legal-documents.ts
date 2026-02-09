"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { pageEndpoints } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import type { Page } from "@/types/page"
import type { PaginationState } from "@/types/landing-page"
import { DEFAULT_PAGE_SIZE } from "@/types/landing-page"

/**
 * Tipo para documento legal
 */
export interface LegalDocument extends Page {
  page_type: 'legal'
  legal_content: any
  legal_sections: { id: string; title: string; level: number }[]
  last_updated_legal: string | null
}

/**
 * Resultado del hook useLegalDocuments
 */
interface UseLegalDocumentsResult {
  documents: LegalDocument[]
  isLoading: boolean
  error: string | null
  pagination: PaginationState
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  setPageSize: (size: number) => void
  toggleDocumentActive: (doc: LegalDocument) => Promise<void>
  deleteDocument: (docId: string) => Promise<void>
  refetch: () => Promise<void>
  getDocument: (id: string) => Promise<LegalDocument | null>
  createDocument: (data: CreateLegalDocumentData) => Promise<LegalDocument | null>
  updateDocument: (id: string, data: UpdateLegalDocumentData) => Promise<LegalDocument | null>
}

/**
 * Datos para crear un documento legal
 */
export interface CreateLegalDocumentData {
  slug?: string
  title: string
  legal_content?: any
  legal_sections?: { id: string; title: string; level: number }[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  status?: 'draft' | 'published'
  is_active?: boolean
  is_public?: boolean
  external_url?: string
}

/**
 * Datos para actualizar un documento legal
 */
export interface UpdateLegalDocumentData {
  slug?: string
  title?: string
  legal_content?: any
  legal_sections?: { id: string; title: string; level: number }[]
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  status?: 'draft' | 'published'
  is_active?: boolean
  is_public?: boolean
  external_url?: string | null
}

/**
 * Opciones para configurar el hook
 */
interface UseLegalDocumentsOptions {
  initialPage?: number
  initialPageSize?: number
  autoFetch?: boolean
}

/**
 * Hook para manejar documentos legales (T&C)
 */
export function useLegalDocuments(options: UseLegalDocumentsOptions = {}): UseLegalDocumentsResult {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    autoFetch = true,
  } = options

  const { user } = useAuth()
  const [documents, setDocuments] = useState<LegalDocument[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize)
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalPages: 0,
    total: 0,
  })

  /**
   * Fetch documentos legales desde el API
   */
  const fetchDocuments = useCallback(
    async (page: number, limit: number) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await pageEndpoints.getLegal({
          page,
          limit,
        })

        if (response.success && response.data) {
          const { data, meta } = response.data

          // Los documentos ya vienen filtrados desde el backend
          const legalDocs = (data || []) as LegalDocument[]

          setDocuments(legalDocs)
          setPagination({
            currentPage: meta.page,
            pageSize: meta.limit,
            totalPages: meta.totalPages,
            total: meta.total,
          })
        } else {
          throw new Error(response.message || "Error al cargar documentos")
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido"
        setError(errorMessage)
        setDocuments([])
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > pagination.totalPages) return
      setCurrentPage(page)
    },
    [pagination.totalPages]
  )

  const nextPage = useCallback(() => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, pagination.totalPages])

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setCurrentPage(1)
  }, [])

  const refetch = useCallback(async () => {
    await fetchDocuments(currentPage, pageSize)
  }, [currentPage, pageSize, fetchDocuments])

  /**
   * Obtener un documento por ID
   */
  const getDocument = useCallback(async (id: string): Promise<LegalDocument | null> => {
    try {
      const response = await pageEndpoints.getById(id)
      if (response.success && response.data) {
        return response.data as unknown as LegalDocument
      }
      return null
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar documento"
      toast.error(errorMessage)
      return null
    }
  }, [])

  /**
   * Crear un nuevo documento legal
   */
  const createDocument = useCallback(async (data: CreateLegalDocumentData): Promise<LegalDocument | null> => {
    try {
      const pageData = {
        ...data,
        page_type: 'legal' as const,
        banner_ids: [],
        faq_ids: [],
        sections: [],
        info_sections: [],
        last_updated_legal: new Date().toISOString(),
        created_by: user?.email || 'system@imagiq.com',
      }

      const response = await pageEndpoints.createComplete({
        page: pageData as any,
        new_banners: [],
        existing_banner_ids: [],
        new_faqs: [],
        existing_faq_ids: [],
        banner_files: [],
      })

      if (response.success && response.data) {
        toast.success("Documento creado exitosamente")
        await refetch()
        return response.data.page as unknown as LegalDocument
      }
      throw new Error("Error al crear documento")
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear documento"
      toast.error(errorMessage)
      return null
    }
  }, [refetch, user])

  /**
   * Actualizar un documento legal
   */
  const updateDocument = useCallback(async (id: string, data: UpdateLegalDocumentData): Promise<LegalDocument | null> => {
    try {
      const pageData = {
        id,
        ...data,
        page_type: 'legal' as const,
        last_updated_legal: new Date().toISOString(),
      }

      const response = await pageEndpoints.createComplete({
        page: pageData as any,
        new_banners: [],
        existing_banner_ids: [],
        new_faqs: [],
        existing_faq_ids: [],
        banner_files: [],
      })

      // Verificar éxito de diferentes formas
      if (response.success) {
        toast.success("Documento actualizado exitosamente")
        await refetch()
        return (response.data?.page || response) as unknown as LegalDocument
      }
      
      // Si la respuesta tiene id, considerar éxito
      if ((response as any).id) {
        toast.success("Documento actualizado exitosamente")
        await refetch()
        return response as unknown as LegalDocument
      }

      throw new Error("Error al actualizar documento")
    } catch (err) {
      console.error('Error actualizando documento:', err)
      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar documento"
      toast.error(errorMessage)
      return null
    }
  }, [refetch])

  /**
   * Toggle estado activo/inactivo
   */
  const toggleDocumentActive = useCallback(
    async (doc: LegalDocument) => {
      try {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, is_active: !d.is_active } : d
          )
        )
        toast.success(
          `Documento ${!doc.is_active ? "activado" : "desactivado"} exitosamente`
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
   * Eliminar documento
   */
  const deleteDocument = useCallback(
    async (docId: string) => {
      try {
        const response = await pageEndpoints.delete(docId)

        if (response.success) {
          toast.success("Documento eliminado exitosamente")

          if (documents.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1)
          } else {
            await refetch()
          }
        } else {
          throw new Error("Error al eliminar el documento")
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al eliminar documento"
        toast.error(errorMessage)
      }
    },
    [documents.length, currentPage, refetch]
  )

  useEffect(() => {
    if (autoFetch) {
      fetchDocuments(currentPage, pageSize)
    }
  }, [currentPage, pageSize, autoFetch, fetchDocuments])

  return {
    documents,
    isLoading,
    error,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    toggleDocumentActive,
    deleteDocument,
    refetch,
    getDocument,
    createDocument,
    updateDocument,
  }
}
