'use client'

import { useState, useEffect, useCallback } from 'react'
import { productCardEndpoints } from '@/lib/api'
import type { ProductCard } from '@/types/product-card'

interface UseProductCardsOptions {
  pageId?: string // Filtrar por página específica
  autoFetch?: boolean // Auto-fetch al montar
}

interface UseProductCardsResult {
  productCards: ProductCard[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createProductCard: (formData: FormData) => Promise<ProductCard | null>
  updateProductCard: (id: string, formData: FormData) => Promise<ProductCard | null>
  deleteProductCard: (id: string) => Promise<boolean>
}

export function useProductCards(
  options: UseProductCardsOptions = {}
): UseProductCardsResult {
  const { pageId, autoFetch = true } = options

  const [productCards, setProductCards] = useState<ProductCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProductCards = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = pageId
        ? await productCardEndpoints.getByPageId(pageId)
        : await productCardEndpoints.getAll()

      if (response.success && response.data) {
        const cards = Array.isArray(response.data) ? response.data : []
        setProductCards(cards)
      } else {
        setError(response.message || 'Error al cargar product cards')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al cargar product cards'
      setError(errorMessage)
      console.error('Error fetching product cards:', err)
    } finally {
      setIsLoading(false)
    }
  }, [pageId])

  const createProductCard = useCallback(
    async (formData: FormData): Promise<ProductCard | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await productCardEndpoints.create(formData)

        if (response.success && response.data) {
          await fetchProductCards() // Refetch para actualizar la lista
          return response.data
        } else {
          setError(response.message || 'Error al crear product card')
          return null
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error al crear product card'
        setError(errorMessage)
        console.error('Error creating product card:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [fetchProductCards]
  )

  const updateProductCard = useCallback(
    async (id: string, formData: FormData): Promise<ProductCard | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await productCardEndpoints.update(id, formData)

        if (response.success && response.data) {
          await fetchProductCards() // Refetch para actualizar la lista
          return response.data
        } else {
          setError(response.message || 'Error al actualizar product card')
          return null
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error al actualizar product card'
        setError(errorMessage)
        console.error('Error updating product card:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [fetchProductCards]
  )

  const deleteProductCard = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await productCardEndpoints.delete(id)

        if (response.success) {
          await fetchProductCards() // Refetch para actualizar la lista
          return true
        } else {
          setError(response.message || 'Error al eliminar product card')
          return false
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error al eliminar product card'
        setError(errorMessage)
        console.error('Error deleting product card:', err)
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fetchProductCards]
  )

  useEffect(() => {
    if (autoFetch) {
      fetchProductCards()
    }
  }, [autoFetch, fetchProductCards])

  return {
    productCards,
    isLoading,
    error,
    refetch: fetchProductCards,
    createProductCard,
    updateProductCard,
    deleteProductCard,
  }
}
