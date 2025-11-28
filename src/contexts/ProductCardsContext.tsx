"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ProductCard } from '@/types/product-card'

// Tipo para product cards en creación (sin ID de BD todavía)
export interface LocalProductCard {
  tempId: string // ID temporal para identificación local
  sectionId: string // ID de la sección a la que pertenece
  image?: File // Archivo de imagen (antes de subir)
  image_url?: string // URL de imagen (si ya existe)
  title: string
  subtitle?: string
  description?: string
  cta_text?: string
  cta_url?: string
  content_position?: {
    title?: { x: string; y: string }
    subtitle?: { x: string; y: string }
    description?: { x: string; y: string }
    cta?: { x: string; y: string }
  }
  text_styles?: {
    title?: Record<string, string>
    subtitle?: Record<string, string>
    description?: Record<string, string>
    cta?: Record<string, string>
  }
}

interface ProductCardsContextType {
  productCards: LocalProductCard[]
  addProductCard: (card: Omit<LocalProductCard, 'tempId'>) => string
  updateProductCard: (tempId: string, card: Partial<LocalProductCard>) => void
  deleteProductCard: (tempId: string) => void
  getCardsBySection: (sectionId: string) => LocalProductCard[]
  reorderCards: (sectionId: string, reorderedCards: LocalProductCard[]) => void
  clearAll: () => void
  loadExistingCards: (cards: ProductCard[], sectionId: string) => void
}

const ProductCardsContext = createContext<ProductCardsContextType | undefined>(undefined)

export function ProductCardsProvider({ children }: { children: React.ReactNode }) {
  const [productCards, setProductCards] = useState<LocalProductCard[]>([])

  const addProductCard = useCallback((card: Omit<LocalProductCard, 'tempId'>) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    setProductCards(prev => [...prev, { ...card, tempId }])
    return tempId
  }, [])

  const updateProductCard = useCallback((tempId: string, updates: Partial<LocalProductCard>) => {
    setProductCards(prev =>
      prev.map(card => (card.tempId === tempId ? { ...card, ...updates } : card))
    )
  }, [])

  const deleteProductCard = useCallback((tempId: string) => {
    setProductCards(prev => prev.filter(card => card.tempId !== tempId))
  }, [])

  const getCardsBySection = useCallback((sectionId: string) => {
    return productCards.filter(card => card.sectionId === sectionId)
  }, [productCards])

  const reorderCards = useCallback((sectionId: string, reorderedCards: LocalProductCard[]) => {
    setProductCards(prev => {
      // Mantener cards de otras secciones y reemplazar los de esta sección
      const otherSectionCards = prev.filter(card => card.sectionId !== sectionId)
      return [...otherSectionCards, ...reorderedCards]
    })
  }, [])

  const clearAll = useCallback(() => {
    setProductCards([])
  }, [])

  const loadExistingCards = useCallback((cards: ProductCard[], sectionId: string) => {
    const localCards: LocalProductCard[] = cards.map(card => ({
      tempId: card.id, // Usar el ID real como tempId
      sectionId,
      image_url: card.image_url,
      title: card.title,
      subtitle: card.subtitle || undefined,
      description: card.description || undefined,
      cta_text: card.cta_text || undefined,
      cta_url: card.cta_url || undefined,
      content_position: card.content_position || undefined,
      text_styles: card.text_styles || undefined,
    }))
    
    // Evitar duplicados: solo agregar cards que no existan ya
    setProductCards(prev => {
      const existingIds = new Set(prev.map(c => c.tempId))
      const newCards = localCards.filter(c => !existingIds.has(c.tempId))
      return [...prev, ...newCards]
    })
  }, [])

  return (
    <ProductCardsContext.Provider
      value={{
        productCards,
        addProductCard,
        updateProductCard,
        deleteProductCard,
        getCardsBySection,
        reorderCards,
        clearAll,
        loadExistingCards,
      }}
    >
      {children}
    </ProductCardsContext.Provider>
  )
}

export function useProductCardsContext() {
  const context = useContext(ProductCardsContext)
  if (!context) {
    throw new Error('useProductCardsContext must be used within ProductCardsProvider')
  }
  return context
}
