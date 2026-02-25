/**
 * Hooks para manejo de productos
 * - Obtener lista de productos con filtros
 * - Búsqueda de productos
 * - Obtener detalles de producto individual
 * - Manejo de favoritos
 * - Recomendaciones personalizadas
 * - Tracking de visualizaciones de productos
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  productEndpoints,
  ProductFilterParams,
  ProductApiResponse,
  ProductApiResponse2,
} from "@/lib/api";

import {mapApiProductsToFrontend ,groupProductsByCategory} from "@/lib/productMapper";
import { StaticImageData } from "next/image";

export interface ProductColor {
  name: string; // Nombre técnico del color (ej: "black", "white")
  hex: string; // Código hexadecimal del color (ej: "#000000")
  label: string; // Nombre mostrado al usuario (ej: "Negro Medianoche")
  sku: string; // SKU específico para esta variante
  price?: string; // Precio específico para esta variante (opcional)
  originalPrice?: string; // Precio original antes de descuento (opcional)
  discount?: string; // Descuento específico para esta variante (opcional)
  stock?: number; // Stock ecommerce disponible para esta variante (opcional)
  stockTiendas?: Record<string, number>; // Stock por tienda para esta variante (opcional)
  stockTotal?: number; // Stock total para esta variante (opcional)
  description?: string; // Descripción detallada de esta variante (opcional)
  capacity?: string; // Capacidad específica de esta variante (256GB, 512GB, 1TB, etc.)
  ram?: string; // Memoria RAM específica de esta variante (12GB, 16GB, etc.)
  imageUrl?: string; // URL de la imagen específica de esta variante (opcional)
  imageDetailsUrls?: string[]; // URLs de las imágenes detalladas de esta variante (opcional)
  // ✅ NUEVA ARQUITECTURA SIMPLIFICADA
  premiumImages?: string[]; // URLs de las imágenes del CARRUSEL premium (sin marcadores especiales)
  devicePremiumImage?: string | null; // URL de la imagen premium del DISPOSITIVO (puede ser null)
  premiumVideos?: string[]; // URLs de los videos premium del carrusel
  visibleStaging?: boolean; // Visible en staging
  visibleProduction?: boolean; // Visible en producción
}

export interface ProductCardProps {
  id: string;
  name: string;
  image: string | StaticImageData;
  colors: ProductColor[];
  rating?: number;
  reviewCount?: number;
  price?: string;
  originalPrice?: string;
  discount?: string;
  isNew?: boolean;
  isFavorite?: boolean;
  onAddToCart?: (productId: string, color: string) => void;
  onToggleFavorite?: (productId: string) => void;
  className?: string;
  // Datos adicionales para la página de detalle
  description?: string | null;
  brand?: string;
  model?: string;
  category?: string;
  menu?: string;
  capacity?: string | null;
  stock?: number;
  stockTotal?: number;
  sku?: string | null;
  detailedDescription?: string | null;
  selectedColor?: ProductColor;
  setSelectedColor?: (color: ProductColor) => void;
  puntos_q?: number; // Puntos Q acumulables por producto (valor fijo por ahora)
  segmento?: string[]; // Array de segmentos del producto (ej: ["Premium"])
  visibleStaging?: boolean; // Visible en staging (primer SKU)
  visibleProduction?: boolean; // Visible en producción (primer SKU)
}


export interface ProductFilters {
  category?: string;
  menu?: string;
  submenu?: string;
  precioMin?: number;
  precioMax?: number;
  color?: string;
  capacity?: string;
  name?: string;
  sku?: string;
  withDiscount?: boolean;
  minStock?: number;
  maxStock?: number;
  stock?: number;
  descriptionKeyword?: string; // Nuevo filtro para palabras clave en descripción
  searchQuery?: string; // Query de búsqueda general para nombre Y desDetallada
  page?: number; // Página actual para paginación
  limit?: number; // Límite de productos por página
  sortBy?: string; // Campo por el cual ordenar (nombre, price, stock, etc.)
  sortOrder?: "desc" | "asc"; // Dirección del ordenamiento
}


interface UseProductsReturn {
  products: ProductCardProps[];
  groupedProducts: Record<string, ProductCardProps[]>;
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  searchProducts: (query: string) => Promise<void>;
  filterProducts: (filters: ProductFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
  hasMore: boolean;
}

export const useProducts = (
  initialFilters?: ProductFilters | (() => ProductFilters)
): UseProductsReturn => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<
    Record<string, ProductCardProps[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>(
    typeof initialFilters === "function"
      ? initialFilters()
      : initialFilters || {}
  );

  // Función para convertir filtros del frontend a parámetros de API
  const convertFiltersToApiParams = useCallback(
    (filters: ProductFilters): ProductFilterParams => {
      const params: ProductFilterParams = {
        page: filters.page || currentPage,
        limit: filters.limit || 50,
        precioMin: 1, // Siempre filtrar productos con precio mayor a 0 por defecto
      };

      // Aplicar filtros específicos (pueden sobrescribir el precioMin por defecto)
      if (filters.category) params.categoria = filters.category;
      if (filters.menu) params.menu = filters.menu;
      if (filters.submenu) params.submenu = filters.submenu;

      // Manejar filtros de precio usando precioMin/precioMax
      if (filters.precioMin !== undefined) {
        params.precioMin = filters.precioMin;
      }

      if (filters.precioMax !== undefined) {
        params.precioMax = filters.precioMax;
      }

      if (filters.color) params.color = filters.color;
      if (filters.capacity) params.capacidad = filters.capacity;
      if (filters.name) params.query = filters.name;
      if (filters.sku) params.sku = filters.sku;
      if(filters.stock) params.stock = filters.stock;
      if (filters.withDiscount !== undefined)
        params.conDescuento = filters.withDiscount;
      if (filters.minStock !== undefined) params.stockMinimo = filters.minStock;
      if (filters.maxStock !== undefined) params.stockMaximo = filters.maxStock;
      if (filters.descriptionKeyword) {
        // Usar el campo desDetallada para buscar en la descripción detallada
        params.desDetallada = filters.descriptionKeyword;
      }

      if (filters.searchQuery) {
        // Búsqueda general: usar el parámetro query del backend
        params.query = filters.searchQuery;
      }

      // Agregar parámetros de ordenamiento
      if (filters.sortBy) {
        // Mapear nombres de campos del frontend a nombres de campos del backend
        const fieldMap: Record<string, string> = {
          name: "nombre",
          price: "precio",
          stock: "stock",
        };
        params.sortBy = fieldMap[filters.sortBy] || filters.sortBy;
      }

      if (filters.sortOrder) {
        params.sortOrder = filters.sortOrder;
      }

      return params;
    },
    [currentPage]
  );

  // Función principal para obtener productos
  const fetchProducts = useCallback(
    async (filters: ProductFilters = {}, append = false) => {
      setLoading(true);
      setError(null);

      try {
        const apiParams = convertFiltersToApiParams(filters);
        const response = await productEndpoints.getFilteredSearch(apiParams);

        if (response.success && response.data && response.data.data) {
          const paginationData = response.data.data;
          const mappedProducts = mapApiProductsToFrontend(paginationData.products);

          if (append) {
            setProducts((prev) => [...prev, ...mappedProducts]);
          } else {
            setProducts(mappedProducts);
            setGroupedProducts(groupProductsByCategory(mappedProducts));
          }

          setTotalItems(paginationData.total);
          setTotalPages(paginationData.totalPages);
          setCurrentPage(paginationData.page);
          setHasNextPage(paginationData.hasNextPage);
          setHasPreviousPage(paginationData.hasPreviousPage);

          // Si no hay resultados y estamos en una página > 1, no hacer nada más
          // El reset de página debe ser manual, no automático
          if (mappedProducts.length === 0 && paginationData.page > 1) {
            console.warn("Empty results on page > 1, but not auto-resetting to avoid infinite loop");
          }
        } else {
          setError(response.message || "Error al cargar productos");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Error de conexión al cargar productos");
      } finally {
        setLoading(false);
      }
    },
    [convertFiltersToApiParams]
  );

  // Función para buscar productos
  const searchProducts = useCallback(
    async (query: string) => {
      const filters = { ...currentFilters, name: query };
      setCurrentFilters(filters);
      setCurrentPage(1);
      await fetchProducts(filters, false);
    },
    [currentFilters, fetchProducts]
  );

  // Función para filtrar productos
  const filterProducts = useCallback(
    async (filters: ProductFilters) => {
      setCurrentFilters(filters);
      // Solo resetear a página 1 si no se especifica una página en los filtros
      if (!filters.page) {
        setCurrentPage(1);
      }
      await fetchProducts(filters, false);
    },
    [fetchProducts]
  );

  // Función para cargar más productos (paginación)
  const loadMore = useCallback(async () => {
    if (hasNextPage && !loading) {
      setCurrentPage((prev) => prev + 1);
      await fetchProducts(currentFilters, true);
    }
  }, [hasNextPage, loading, currentFilters, fetchProducts]);

  // Función para ir a una página específica
  const goToPage = useCallback(
    async (page: number) => {
      if (page >= 1 && page <= totalPages && !loading) {
        const filtersWithPage = { ...currentFilters, page };
        setCurrentFilters(filtersWithPage);
        await fetchProducts(filtersWithPage, false);
      }
    },
    [totalPages, loading, currentFilters, fetchProducts]
  );

  // Función para refrescar productos con filtros dinámicos
  const refreshProducts = useCallback(async () => {
    const filtersToUse =
      typeof initialFilters === "function" ? initialFilters() : currentFilters;
    await fetchProducts(filtersToUse, false);
  }, [initialFilters, currentFilters, fetchProducts]);

  // Cargar productos iniciales solamente
  useEffect(() => {
    const filtersToUse =
      typeof initialFilters === "function"
        ? initialFilters()
        : initialFilters || {};
    fetchProducts(filtersToUse, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    products,
    groupedProducts,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    searchProducts,
    filterProducts,
    loadMore,
    goToPage,
    refreshProducts,
    hasMore: hasNextPage,
  };
};

export const useProduct = (productId: string) => {
  const [product, setProduct] = useState<ProductCardProps | null>(null);
  const [loading, setLoading] = useState(true); // Cambiar a true inicialmente
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductCardProps[]>(
    []
  );

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const codigoMarketBase = productId;

        // Usar el endpoint específico para buscar por codigoMarketBase
        const response = await productEndpoints.getByCodigoMarket(codigoMarketBase);

        if (response.success && response.data) {
          const apiData = response.data as ProductApiResponse2;
          console.log("Fetched product data:", apiData);
          const mappedProducts = mapApiProductsToFrontend(apiData.products);

          if (mappedProducts.length > 0) {
            const foundProduct = mappedProducts[0]; // Tomar el primer producto encontrado
            setProduct(foundProduct);

            // Obtener productos relacionados (otros productos con el mismo modelo base)
            const modelBase =
              foundProduct.name.split(" ")[1] ||
              foundProduct.name.split(" ")[0];
            const related = mappedProducts
              .filter(
                (p: ProductCardProps) => p.name.includes(modelBase) && p.id !== foundProduct.id
              )
              .slice(0, 4);
            setRelatedProducts(related);
          } else {
            setError("Producto no encontrado");
          }
        } else {
          setError("Error al obtener datos del producto");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Error al cargar el producto");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    } else {
      setLoading(false);
      setError("ID de producto no válido");
    }
  }, [productId]);

  return {
    product,
    loading,
    error,
    relatedProducts,
  };
};



