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
  ProductBundle,
  ProductGrouped,
  SearchBundlesResult,
  ProductPaginationData,
} from "@/lib/api";

import {mapApiProductsToFrontend, mapBundlesAndProductsToFrontend, mapGroupedProductToFrontend, mapBundleToFrontend, groupProductsByCategory} from "@/lib/productMapper";
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
  // Campos para bundles
  isBundle?: boolean;
  bundlePrice?: number;
  bundleDiscount?: number;
  skusBundle?: string[];
  fechaInicio?: Date | string;
  fechaFinal?: Date | string;
  horaInicio?: string;
  horaFinal?: string;
  bundleDetailImages?: string[]; // URLs de imágenes de detalle para bundles
  skuMultimedia?: string; // ✨ SKU para multimedia en bundles (para cargar/guardar imágenes)
}


export interface ProductFilters {
  category?: string;
  menu?: string;
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
  productType?: 'bundles' | 'products'; // V2: Filtrar por tipo de producto (solo bundles o products)
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
  const [loading, setLoading] = useState(false); // Como en main: iniciar en false
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

      // Manejar filtros de precio usando precioMin/precioMax
      if (filters.precioMin !== undefined) {
        params.precioMin = filters.precioMin;
      }

      if (filters.precioMax !== undefined) {
        params.precioMax = filters.precioMax;
      }

      if (filters.color) params.color = filters.color;
      if (filters.capacity) params.capacidad = filters.capacity;
      if (filters.name) {
        params.query = filters.name; // Mantener para compatibilidad con V1
        
        // V2: Para bundles buscar por 'modelo', para productos por 'nombre'
        if (filters.productType === 'bundles') {
          params.modelo = filters.name; // Bundles: buscar por modelo
        } else {
          params.nombre = filters.name; // Productos: buscar por nombre
        }
      }
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
        // Búsqueda general: usar tanto nombre como desDetallada con OR
        params.nombre = filters.searchQuery;
        params.desDetallada = filters.searchQuery;
        params.modelo = filters.searchQuery;
        params.filterMode = "OR";
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

      // V2: Agregar productType solo si está presente y es para bundles (V2)
      // No incluir productType para productos normales (V1 no lo acepta)
      if (filters.productType === 'bundles') {
        params.productType = filters.productType;
      }

      return params;
    },
    [currentPage]
  );

  // Función principal para obtener productos (V1 para productos, V2 para bundles)
  const fetchProducts = useCallback(
    async (filters: ProductFilters = {}, append = false) => {
      setLoading(true);
      setError(null);

      try {
        const apiParams = convertFiltersToApiParams(filters);
        
        // V2: Usar V2 solo para bundles, V1 directamente para productos
        let response;
        let useV2 = false;
        
        if (filters.productType === 'bundles') {
          // Para bundles, usar V2
          try {
            console.log("[fetchProducts] Usando endpoint V2 para bundles con params:", apiParams);
            response = await productEndpoints.getFilteredSearchV2(apiParams);
            
            // Verificar si la respuesta V2 es válida
            if (response.success && response.data) {
              const bundlesResult = response.data.data || response.data;
              if (bundlesResult && bundlesResult.products !== undefined) {
                useV2 = true;
                console.log("[fetchProducts] V2 Response válida para bundles:", response);
              }
            }
          } catch (v2Error) {
            console.warn("[fetchProducts] V2 no disponible para bundles, usando V1:", v2Error);
            // Limpiar parámetros específicos de V2 que V1 no acepta
            const v1Params = { ...apiParams };
            delete v1Params.productType; // V1 no acepta productType
            delete v1Params.modelo; // V1 no acepta modelo
            delete v1Params.filterMode; // V1 no acepta filterMode
            response = await productEndpoints.getFilteredSearch(v1Params);
          }
        } else {
          // Para productos normales, usar V1 directamente (sin V2)
          // Limpiar parámetros específicos de V2 que V1 no acepta
          const v1Params = { ...apiParams };
          delete v1Params.productType; // V1 no acepta productType
          delete v1Params.modelo; // V1 no acepta modelo
          delete v1Params.filterMode; // V1 no acepta filterMode
          
          console.log("[fetchProducts] Usando endpoint V1 para productos con params:", v1Params);
          response = await productEndpoints.getFilteredSearch(v1Params);
        }

        if (response.success && response.data) {
          if (useV2) {
            // Procesar respuesta V2
            const bundlesResult = response.data.data || response.data;
            if (bundlesResult && bundlesResult.products) {
              // Type assertion: sabemos que en V2 es SearchBundlesResult
              const paginationData = bundlesResult as SearchBundlesResult;
              // Type assertion: sabemos que en V2 los productos son (ProductBundle | ProductGrouped)[]
              const mappedProducts = mapBundlesAndProductsToFrontend(
                paginationData.products as (ProductBundle | ProductGrouped)[]
              );

              if (append) {
                setProducts((prev) => [...prev, ...mappedProducts]);
              } else {
                setProducts(mappedProducts);
                setGroupedProducts(groupProductsByCategory(mappedProducts));
              }

              setTotalItems(paginationData.totalItems);
              setTotalPages(paginationData.totalPages);
              setCurrentPage(paginationData.currentPage ?? 1); // Usar 1 si es undefined o NaN
              setHasNextPage(paginationData.hasNextPage);
              setHasPreviousPage(paginationData.hasPreviousPage);
            } else {
              setError("Error: Estructura de respuesta V2 inválida");
            }
          } else {
            // Procesar respuesta V1 (como en main)
            console.log("[fetchProducts] Procesando respuesta V1:", response.data);
            if (response.data.data) {
              // Type assertion: sabemos que en V1 es ProductPaginationData
              const paginationData = response.data.data as ProductPaginationData;
              console.log("[fetchProducts] Pagination data V1:", {
                total: paginationData.total,
                page: paginationData.page,
                totalPages: paginationData.totalPages,
                productsCount: paginationData.products?.length || 0
              });
              
              const mappedProducts = mapApiProductsToFrontend(paginationData.products);
              console.log("[fetchProducts] Productos mapeados:", mappedProducts.length);

              if (append) {
                setProducts((prev) => [...prev, ...mappedProducts]);
              } else {
                setProducts(mappedProducts);
                setGroupedProducts(groupProductsByCategory(mappedProducts));
              }

              setTotalItems(paginationData.total);
              setTotalPages(paginationData.totalPages);
              setCurrentPage(paginationData.page ?? 1); // Usar 1 si es undefined o NaN
              setHasNextPage(paginationData.hasNextPage);
              setHasPreviousPage(paginationData.hasPreviousPage);
            } else {
              console.error("[fetchProducts] V1: No hay data.data en la respuesta:", response.data);
              setError(response.message || "Error al cargar productos");
            }
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
    console.log("[useProducts] Cargando productos iniciales con filtros:", filtersToUse);
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

        // Usar el endpoint V2 que soporta bundles y productos tradicionales
        const response = await productEndpoints.getByCodigoMarketV2(codigoMarketBase);

        console.log("V2 Response for product detail:", response);
        console.log("Response structure:", {
          success: response.success,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
        });

        if (response.success && response.data) {
          // El endpoint V2 retorna ProductApiResponseV2 que contiene SearchBundlesResult en data.data
          const bundlesResult = response.data.data || response.data;
          
          if (bundlesResult && bundlesResult.products && bundlesResult.products.length > 0) {
            // Mapear bundles + productos tradicionales
            const mappedProducts = mapBundlesAndProductsToFrontend(bundlesResult.products);

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
            console.error("Invalid response structure:", bundlesResult);
            setError("Producto no encontrado");
          }
        } else {
          console.error("Response error:", {
            success: response.success,
            message: response.message,
            data: response.data,
          });
          setError(response.message || "Error al obtener datos del producto");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Error de conexión al cargar el producto");
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



