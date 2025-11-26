/**
 * Hook especializado para obtener productos de una sección de oferta
 * Filtra automáticamente según el tipo jerárquico seleccionado
 * Soporta búsqueda con query para buscar en el backend
 */

"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useProducts, ProductCardProps } from "@/features/products/useProducts"
import { useCategories } from "@/features/categories/useCategories"

interface ProductSection {
  id: string
  type: "categoria" | "menu" | "submenu"
  categoryId?: string
  menuId?: string
  submenuId?: string
}

interface UseSectionProductsReturn {
  products: ProductCardProps[]
  loading: boolean
  error: string | null
  canLoadProducts: boolean
  searchProducts: (query: string) => void
}

export function useSectionProducts(section: ProductSection): UseSectionProductsReturn {
  const [searchQuery, setSearchQuery] = useState("")
  const { categories } = useCategories()

  // Determinar si tenemos suficiente información para cargar productos
  const canLoadProducts = useMemo(() => {
    switch (section.type) {
      case "categoria":
        return !!section.categoryId
      case "menu":
        return !!section.categoryId && !!section.menuId
      case "submenu":
        return !!section.categoryId && !!section.menuId && !!section.submenuId
      default:
        return false
    }
  }, [section.type, section.categoryId, section.menuId, section.submenuId])

  // Resolver IDs a nombres
  const sectionNames = useMemo(() => {
    if (!categories || categories.length === 0) return { categoryName: "", menuName: "", submenuName: "" }

    let categoryName = ""
    let menuName = ""
    let submenuName = ""

    const category = categories.find(cat => cat.id === section.categoryId)
    if (category) {
      categoryName = category.name
      
      if (section.menuId) {
        const menu = category.menus?.find(m => m.id === section.menuId)
        if (menu) {
          menuName = menu.name
          
          if (section.submenuId) {
            const submenu = menu.submenus?.find(s => s.id === section.submenuId)
            if (submenu) {
              submenuName = submenu.name
            }
          }
        }
      }
    }

    return { categoryName, menuName, submenuName }
  }, [categories, section.categoryId, section.menuId, section.submenuId])

  // Construir filtros dinámicos
  const filters = useMemo(() => {
    if (!canLoadProducts) return {}

    const baseFilters: any = {
      limit: 100, // Límite máximo permitido por el backend
      sortBy: "nombre",
      sortOrder: "asc" as const,
    }

    // Si hay búsqueda, agregar searchQuery
    if (searchQuery.trim()) {
      baseFilters.searchQuery = searchQuery.trim()
    }

    // Agregar filtros usando NOMBRES en lugar de IDs
    if (section.type === "categoria" && sectionNames.categoryName) {
      baseFilters.category = sectionNames.categoryName
    } else if (section.type === "menu" && sectionNames.menuName) {
      baseFilters.menu = sectionNames.menuName
    } else if (section.type === "submenu" && sectionNames.submenuName) {
      baseFilters.submenu = sectionNames.submenuName
    }

    return baseFilters
  }, [canLoadProducts, section.type, sectionNames, searchQuery])

  // Usar hook de productos con filtros dinámicos
  const { products, loading, error, filterProducts } = useProducts(filters)

  // Función para buscar productos
  const searchProducts = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Refrescar productos cuando cambien los filtros
  useEffect(() => {
    if (canLoadProducts && sectionNames.categoryName) {
      const newFilters = { ...filters }
      filterProducts(newFilters)
    }
  }, [canLoadProducts, searchQuery, section.categoryId, section.menuId, section.submenuId, sectionNames.categoryName])

  return {
    products: canLoadProducts ? products : [],
    loading: canLoadProducts ? loading : false,
    error: canLoadProducts ? error : null,
    canLoadProducts,
    searchProducts,
  }
}
