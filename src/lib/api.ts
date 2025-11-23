/**
 * Cliente API para comunicación con microservicios
 * - Configuración base de Axios o Fetch
 * - Interceptors para auth tokens
 * - Manejo centralizado de errores
 * - Retry logic para requests fallidos
 * - Rate limiting y caching
 * - TypeScript interfaces para requests/responses
 */

import { BackendCategory, BackendCategoryV2, BackendMenu, BackendMenuV2, BackendSubmenu, CreateCategoryRequest, UpdateCategoryRequest, CreateMenuRequest, UpdateMenuRequest, CreateSubmenuRequest, UpdateSubmenuRequest, BackendWhatsAppTemplate } from "@/types";
import { BackendBanner, BannerPaginationData } from "@/types/banner";
import { ProductColumn, DisplayTypesResponse, FilterOperator, DynamicFilter, FilterOrderConfig } from "@/types/filters";
import { apiClient as apiClientWithKey, apiClientFormData, getApiKey } from "@/lib/api-client";


// API Client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper: encode SKU for safe URL usage (replace '/' with '_')
const encodeSkuForPath = (sku: string) => sku.replace(/\//g, "_");

// Generic API response type
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// API Client class
export class ApiClient {
  private readonly baseURL: string;
  private readonly headers: Record<string, string>;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.headers = {
      "Content-Type": "application/json",
      "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || '',
    };
  }

  // Helper para obtener el token de localStorage
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('imagiq_token');
    }
    return null;
  }

  // Helper para agregar el token de autorización a los headers
  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();

    if (token) {
      return {
        ...this.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
    return this.headers;
  }


  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const apiKey = getApiKey();
    const baseHeaders = useAuth ? this.getAuthHeaders() : this.headers;
    
    // Asegurar que el API key siempre esté incluido, incluso si hay headers personalizados
    const headers = new Headers(baseHeaders);
    if (apiKey) {
      headers.set('X-API-Key', apiKey);
    }
    
    // Combinar headers personalizados de options, asegurando que el API key siempre esté presente
    if (options.headers) {
      const customHeaders = new Headers(options.headers);
      customHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
      // Re-establecer el API key después de combinar headers personalizados
      if (apiKey) {
        headers.set('X-API-Key', apiKey);
      }
    }
    
    const config: RequestInit = {
      ...options,
      headers: headers,
    };

    try {
      const response = await fetch(url, config);

      // Log errores del servidor para debugging
      if (!response.ok) {
        console.error(`[API Error] ${response.status} ${response.statusText}`, {
          url,
          status: response.status,
          statusText: response.statusText,
        });
      }

      // Intentar parsear JSON
      let data;
      try {
        data = await response?.json();
      } catch (jsonError) {
        // Si no es JSON válido, retornar error
        console.error("JSON parsing error:", jsonError, {
          url,
          status: response.status,
          statusText: response.statusText,
        });
        return {
          data: {} as T,
          success: false,
          message: `Error al procesar la respuesta del servidor (Status: ${response.status})`,
        };
      }

      // Detectar error 401 con token inválido o expirado y cerrar sesión automáticamente
      if (response.status === 401 && useAuth) {
        const errorMessage = data?.message || '';
        if (errorMessage.includes('Invalid or expired token') || errorMessage.includes('token')) {
          console.warn('[Auth] Token inválido o expirado detectado. Cerrando sesión...');

          // Limpiar localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('imagiq_token');
            localStorage.removeItem('imagiq_user');

            // Redirigir al login
            window.location.href = '/login';
          }
        }
      }

      // Log errores 500 con más detalle
      if (!response.ok && response.status >= 500) {
        console.error(`[Backend Error] ${response.status}`, {
          url,
          endpoint,
          data,
          message: data?.message || data?.error || 'Error desconocido del servidor',
        });
      }

      return {
        data: data as T,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : (typeof data?.error === 'string' ? data.error : undefined),
        errors: data?.errors,
      };
    } catch (error) {
      console.error("API request failed:", error, {
        url,
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        data: {} as T,
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      };
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, useAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" }, useAuth);
  }

  async post<T>(endpoint: string, data?: unknown, useAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }, useAuth);
  }

  async put<T>(endpoint: string, data?: unknown, useAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }, useAuth);
  }

  async delete<T>(endpoint: string, data?: unknown, useAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    }, useAuth);
  }

  async patch<T>(endpoint: string, data?: unknown, useAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }, useAuth);
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const apiKey = getApiKey();
    const config: RequestInit = {
      method: "POST",
      body: formData,
      headers: {
        // No incluir Content-Type para que el browser lo establezca automáticamente con boundary
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    };

    try {
      const response = await fetch(url, config);

      // Intentar parsear JSON
      let data;
      try {
        data = await response?.json();
      } catch (jsonError) {
        // Si no es JSON válido, retornar error
        console.error("JSON parsing error:", jsonError);
        return {
          data: {} as T,
          success: false,
          message: `Error al procesar la respuesta del servidor (Status: ${response.status})`,
        };
      }

      return {
        data: data as T,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : undefined,
        errors: data?.errors,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        data: {} as T,
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      };
    }
  }

  async putFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const apiKey = getApiKey();
    const config: RequestInit = {
      method: "PUT",
      body: formData,
      headers: {
        // No incluir Content-Type para que el browser lo establezca automáticamente con boundary
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    };

    try {
      const response = await fetch(url, config);

      // Intentar parsear JSON
      let data;
      try {
        data = await response?.json();
      } catch (jsonError) {
        // Si no es JSON válido, retornar error
        console.error("JSON parsing error:", jsonError);
        return {
          data: {} as T,
          success: false,
          message: `Error al procesar la respuesta del servidor (Status: ${response.status})`,
        };
      }

      return {
        data: data as T,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : undefined,
        errors: data?.errors,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        data: {} as T,
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Product API endpoints
export const productEndpoints = {
  getAll: () => apiClient.get<ProductApiResponse>("/api/products"),
  getFiltered: (params: ProductFilterParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const url = `/api/products/filtered?${searchParams.toString()}`;
    return apiClient.get<ProductApiResponse>(url);
  },
  getFilteredSearch: (params: ProductFilterParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const url = `/api/products/search/grouped?${searchParams.toString()}`;
    return apiClient.get<ProductApiResponse>(url);
  },
  // V2: Endpoint que incluye bundles + productos tradicionales
  // Nota: Este endpoint usa el API key automáticamente a través de apiClient.get()
  // El API key se incluye en el header 'X-API-Key' para autenticación
  getFilteredSearchV2: (params: ProductFilterParams) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const url = `/api/products/v2/search/grouped?${searchParams.toString()}`;
    // El método get() incluye automáticamente el API key en los headers
    return apiClient.get<ProductApiResponseV2>(url);
  },
  getById: (id: string) =>
    apiClient.get<ProductApiResponse>(`/api/products/${id}`),
  getByCategory: (category: string) =>
    apiClient.get<ProductApiResponse>(
      `/api/products/filtered?categoria=${category}`
    ),
  getByMenu: (menu: string) =>
    apiClient.get<ProductApiResponse>(
      `/api/products/filtered?menu=${menu}`
    ),
  getByCodigoMarket: (codigoMarket: string) =>
    apiClient.get<ProductApiResponse2>(
      `/api/products/filtered?codigoMarket=${codigoMarket}`
    ),
  // V2: Endpoint que busca por codigoMarket o product_sku (soporta bundles)
  // Nota: Este endpoint usa el API key automáticamente a través de apiClient.get()
  getByCodigoMarketV2: (codigoMarket: string) => {
    const url = `/api/products/v2/filtered?codigoMarket=${codigoMarket}`;
    // El método get() incluye automáticamente el API key en los headers
    return apiClient.get<ProductApiResponseV2>(url);
  },
  search: (query: string) =>
    apiClient.get<ProductApiResponse>(`/api/products/filtered?nombre=${query}`),
  getSummary: () => apiClient.get<ProductSummary>("/api/products/summary"),
  // V2: Endpoint de resumen que incluye información de bundles
  // Nota: Este endpoint usa el API key automáticamente a través de apiClient.get()
  getSummaryV2: () => apiClient.get<ProductSummaryV2>("/api/products/v2/summary"),
  getColumnNames: () => apiClient.get<ProductColumn[]>("/api/products/columns/metadata"),
  getDistinctValues: (columnKey: string, params?: { categoria?: string; menu?: string; submenu?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.categoria) {
      searchParams.append("categoria", params.categoria);
    }
    if (params?.menu) {
      searchParams.append("menu", params.menu);
    }
    if (params?.submenu) {
      searchParams.append("submenu", params.submenu);
    }
    const queryString = searchParams.toString();
    const url = `/api/products/distinct/${columnKey}${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<string[]>(url);
  },
  getDisplayTypes: (columnKey: string, operator?: FilterOperator) => {
    const searchParams = new URLSearchParams();
    if (operator) {
      searchParams.append("operator", operator);
    }
    const queryString = searchParams.toString();
    const url = `/api/products/columns/${columnKey}/display-types${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<DisplayTypesResponse>(url);
  },
  updateMedia: (id: string, data: ProductMediaUpdateData) =>
    apiClient.put<ProductMediaUpdateResponse>(`/api/products/${id}/media`, data),
  getMultimedia: (sku: string) =>
    apiClient.get<ProductMultimediaData>(`/api/multimedia/producto/${encodeSkuForPath(sku)}`),

  // Modificar imagen en posición específica
  updateImageAtPosition: (sku: string, numero: number, imageFile: File) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(`${API_BASE_URL}/api/multimedia/producto/${safeSku}/imagen/${numero}`, {
      method: "PUT",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      const data = await response.json();
      return {
        data,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : (data?.error || "Error desconocido"),
      };
    }).catch((error) => ({
      data: {},
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // Agregar una imagen al final
  addImage: (sku: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(`${API_BASE_URL}/api/multimedia/producto/${safeSku}/imagen/agregar`, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      const data = await response.json();
      return {
        data,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : (data?.error || "Error desconocido"),
      };
    }).catch((error) => ({
      data: {},
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // Agregar varias imágenes al final
  addMultipleImages: (sku: string, imageFiles: File[]) => {
    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('files', file);
    });

    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(`${API_BASE_URL}/api/multimedia/producto/${safeSku}/imagenes/agregar-multiples`, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      const data = await response.json();
      return {
        data,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : (data?.error || "Error desconocido"),
      };
    }).catch((error) => ({
      data: {},
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // Subir múltiples imágenes usando multiple_data (preview + detalles)
  // Si previewFile es null, mantiene la preview existente
  uploadMultipleData: (sku: string, previewFile: File | null, detailFiles: File[]) => {
    const formData = new FormData();

    // Agregar SKU
    formData.append('sku', sku);

    // Agregar preview (Blob vacío si no se modifica)
    if (previewFile) {
      formData.append('file', previewFile);
    } else {
      // Enviar un Blob vacío para indicar que no se modifica la preview
      formData.append('file', new Blob(), '');
    }

    // Agregar imágenes de detalle
    detailFiles.forEach((file) => {
      formData.append('file', file);
    });

    const apiKey = getApiKey();
    return fetch(`${API_BASE_URL}/api/multimedia/producto/multiple_data`, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      const data = await response.json();
      return {
        data,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : (data?.error || "Error desconocido"),
      };
    }).catch((error) => ({
      data: {},
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // Obtener videos premium
  getPremiumVideos: (sku: string) => {
    const safeSku = encodeSkuForPath(sku);
    return apiClient.get<{ videos: string[] }>(`/api/multimedia/producto/${safeSku}/premium-videos`);
  },

  // Obtener imágenes premium
  getPremiumImages: (sku: string) => {
    const safeSku = encodeSkuForPath(sku);
    return apiClient.get<{ images: string[] }>(`/api/multimedia/producto/${safeSku}/premium-images`);
  },

  // Reordenar imágenes existentes
  reorderImages: (sku: string, imageUrls: string[]) => {
    const safeSku = encodeSkuForPath(sku);
    return apiClient.put<{ success: boolean; message: string }>(
      `/api/multimedia/producto/${safeSku}/reordenar`,
      {
        sku: safeSku,
        imageUrls
      }
    );
  },

  // Eliminar una o varias imágenes de detalle
  deleteDetailImages: (sku: string, numeros: number[]) => {
    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(`${API_BASE_URL}/api/multimedia/producto/${safeSku}/imagenes-detalle`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
      body: JSON.stringify({ numeros }),
    }).then(async (response) => {
      const data = await response.json();
      return {
        data,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : (data?.error || "Error desconocido"),
      };
    }).catch((error) => ({
      data: {},
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // Eliminar imagen preview
  deletePreviewImage: (sku: string) => {
    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(`${API_BASE_URL}/api/multimedia/producto/${safeSku}/preview`, {
      method: "DELETE",
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      const data = await response.json();
      return {
        data,
        success: response.ok,
        message: typeof data?.message === 'string' ? data.message : (data?.error || "Error desconocido"),
      };
    }).catch((error) => ({
      data: {},
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },
};

// Product filter parameters interface
export interface ProductFilterParams {
  categoria?: string;
  menu?: string;
  precioMin?: number;
  precioMax?: number;
  conDescuento?: boolean;
  stockMinimo?: number;
  stockMaximo?: number;
  color?: string;
  capacidad?: string;
  nombre?: string;
  query?: string;
  modelo?: string;
  desDetallada?: string;
  codigoMarket?: string;
  sku?: string;
  filterMode?: string;
  page?: number;
  stock?: number;
  limit?: number;
  sortBy?: string;
  productType?: 'bundles' | 'products'; // V2: Filtrar por tipo de producto (solo bundles o products)
  sortOrder?: "desc" | "asc";
}


// API Response types
export interface ProductPaginationData {
  products: ProductApiData[];
  total: number; // Total de productos encontrados
  page: number; // Página actual
  limit: number; // Límite de productos por página
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  message?: string; // Mensaje opcional del backend
}

export interface ProductApiResponse {
  data: ProductPaginationData; // El backend envuelve los datos en un campo "data"
  success?: boolean;
  message?: string;
}

export interface ProductApiResponse2 {
   products: ProductApiData[];
  total: number; // Total de productos encontrados
  page: number; // Página actual
  limit: number; // Límite de productos por página
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  message?: string; // Mensaje opcional del backend
}

export interface ProductSummary {
  productsTotal: number;
  totalValue: number;
  lowStock: number;
}

// V2: ProductSummary que incluye información de bundles
export interface ProductSummaryV2 {
  productsTotal: number; // Total de productos tradicionales
  bundlesTotal: number; // Total de bundles activos
  totalValue: number; // Valor total del inventario (productos + bundles)
  lowStock: number; // Productos con stock ≤ 10 (solo productos tradicionales)
  bundlesActive: number; // Bundles activos actualmente
}

export interface ProductApiData {
  codigoMarketBase: string;
  codigoMarket?: string[];
  nombreMarket: string | string[];
  categoria: string;
  menu: string;
  modelo: string | string[];
  peso?: string | string[];
  ancho?: string | string[];
  alto?: string | string[];
  color?: string[];
  capacidad?: string[];
  memoriaram?: string[]; // Memoria RAM del producto (ej: ["12GB", "16GB"])
  descGeneral?: string | null;
  sku?: string[];
  desDetallada?: string[];
  stock?: number[];
  stockTiendas?: Record<string, number>[];
  stockTotal?: number[];
  imagePreviewUrl?: string[];
  imageDetailsUrls?: string[][]; // Array de arrays de URLs de imágenes detalladas
  urlImagenes?: string[];
  urlRender3D?: string[];
  precioNormal?: number[];
  precioDescto?: number[];
  fechaInicioVigencia?: string[];
  fechaFinalVigencia?: string[];
  // ✅ NUEVA ARQUITECTURA SIMPLIFICADA
  imagen_premium?: string[][]; // Array de arrays: Imágenes del CARRUSEL (sin marcadores especiales)
  imagen_final_premium?: (string | null)[]; // Array de strings: Imagen premium del DISPOSITIVO (una por color)
  video_premium?: string[][]; // Array de arrays: Videos del carrusel
  segmento?: string[]; // Array de segmentos del producto (ej: ["Premium"])
}

// V2: Tipos para Bundles y Productos Agrupados
/**
 * Bundle de productos (isBundle: true)
 */
export interface ProductBundle {
  isBundle: true;
  product_sku: string;
  sku_multimedia?: string; // ✨ SKU para multimedia (usado para imágenes y contenido multimedia en bundles)
  modelo: string; // Concatenación de modelos: "Modelo1 + Modelo2"
  categoria?: string;
  menu?: string;
  submenu?: string;
  bundle_price?: number; // Precio del bundle
  bundle_discount?: number;
  ind_entre_estre?: number;
  fecha_inicio: Date | string;
  fecha_final: Date | string;
  hora_inicio: string;
  hora_final: string;
  skus_bundle: string[]; // Array de SKUs que componen el bundle
  // ✨ NUEVOS: Campos de imágenes desde product_media (igual que productos tradicionales)
  imagePreviewUrl?: string[]; // Array con 1 URL de preview (igual que ProductGrouped)
  imageDetailsUrls?: string[][]; // Array de arrays con URLs de detalle (igual que ProductGrouped)
  imagenPremium?: string[][]; // Array de arrays con imágenes premium del carrusel (igual que ProductGrouped)
  videoPremium?: string[][]; // Array de arrays con videos premium del carrusel (igual que ProductGrouped)
  imagenFinalPremium?: string[][]; // Array de arrays con imagen final premium del dispositivo (igual que ProductGrouped)
}

/**
 * Producto tradicional agrupado (isBundle: false)
 * Esencialmente igual a ProductApiData pero con isBundle explícito
 */
export interface ProductGrouped {
  isBundle: false;
  codigoMarketBase: string;
  codigoMarket?: string[];
  nombreMarket: string | string[];
  categoria: string;
  menu: string;
  modelo: string | string[];
  peso?: string | string[];
  ancho?: string | string[];
  alto?: string | string[];
  color?: string[];
  capacidad?: string[];
  memoriaram?: string[];
  descGeneral?: string | null;
  sku?: string[];
  desDetallada?: string[];
  stock?: number[];
  stockTiendas?: Record<string, number>[];
  stockTotal?: number[];
  imagePreviewUrl?: string[];
  imageDetailsUrls?: string[][];
  urlImagenes?: string[];
  urlRender3D?: string[];
  precioNormal?: number[];
  precioeccommerce?: number[]; // Precio ecommerce
  precioDescto?: number[];
  fechaInicioVigencia?: string[];
  fechaFinalVigencia?: string[];
  imagen_premium?: string[][];
  imagen_final_premium?: (string | null)[];
  video_premium?: string[][];
  segmento?: string[];
  // Campos adicionales que vienen del API
  subcategoria?: string;
  nombreColor?: string[];
  ean?: string[];
  cantidadTiendas?: number[];
  cantidadTiendasReserva?: number[];
}

/**
 * Respuesta del endpoint V2 que incluye bundles + productos tradicionales
 */
export interface SearchBundlesResult {
  products: (ProductBundle | ProductGrouped)[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductApiResponseV2 {
  data: SearchBundlesResult;
  success?: boolean;
  message?: string;
}

// Product media update interfaces
export interface ProductMediaUpdateData {
  sku: string;
  codigoMarket: string;
  previewImage?: string | null;
  detailImages?: string[];
  videos?: string[];
  glbFile?: File | null;
  usdzFile?: File | null;
}

export interface ProductMediaUpdateResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ProductMultimediaData {
  id: number;
  sku: string;
  image_preview_url: string | null;
  image_details_urls: string[];
  video_urls: string[];
  total_images: number;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Categories API endpoints
export const categoryEndpoints = {
  getVisibleCompletas: () => apiClient.get<BackendCategory[]>("/api/categorias/visibles/completas"),
  // V2: Endpoint de categorías que incluye información de bundles
  // Nota: Este endpoint usa el API key automáticamente a través de apiClient.get()
  getVisibleCompletasV2: () => apiClient.get<BackendCategoryV2[]>("/api/categorias/v2/visibles/completas"),
  getDistinct: () => apiClient.get<string[]>("/api/categorias/distinct"),
  create: (data: CreateCategoryRequest) =>
    apiClient.post<BackendCategory>("/api/categorias/visibles", data),
  update: (uuid: string, data: UpdateCategoryRequest) =>
    apiClient.patch<BackendCategory>(`/api/categorias/visibles/${uuid}`, data),
  updateActiveStatus: (uuid: string, activo: boolean) =>
    apiClient.patch<{ success: boolean; message?: string }>(`/api/categorias/visibles/${uuid}/activo`, { activo }),
  delete: (uuid: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(`/api/categorias/visibles/${uuid}`),
  sync: () =>
    apiClient.post<{ success: boolean; message?: string }>("/api/categorias/sync"),
  updateOrder: (categoryIds: string[]) =>
    apiClient.put<{ success: boolean; message?: string }>("/api/categorias/visibles/order", { categoryIds }),
};

// Menus API endpoints
export const menuEndpoints = {
  // GET /api/categorias/visibles/:categoryId/menus
  getByCategory: (categoryId: string) =>
    apiClient.get<BackendMenu[]>(`/api/categorias/visibles/${categoryId}/menus`),
  // GET /api/categorias/distinct/menus?categoria=CATEGORIA_NAME
  getDistinct: (categoryName: string) =>
    apiClient.get<string[]>(`/api/categorias/distinct/menus?categoria=${encodeURIComponent(categoryName)}`),
  // POST /api/menus/visibles
  create: (data: CreateMenuRequest & { categoriasVisiblesId: string }) =>
    apiClient.post<BackendMenu>(`/api/menus/visibles`, data),
  // PATCH /api/menus/visibles/:menuId
  update: (menuId: string, data: UpdateMenuRequest) =>
    apiClient.patch<BackendMenu>(`/api/menus/visibles/${menuId}`, data),
  // PATCH /api/menus/visibles/:menuId/activo
  updateActiveStatus: (menuId: string, activo: boolean) =>
    apiClient.patch<{ success: boolean; message?: string }>(`/api/menus/visibles/${menuId}/activo`, { activo }),
  // DELETE /api/menus/visibles/:menuId
  delete: (menuId: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(`/api/menus/visibles/${menuId}`),
  // PUT /api/menus/visibles/order
  updateOrder: (menuIds: string[]) =>
    apiClient.put<{ success: boolean; message?: string }>("/api/menus/visibles/order", { menuIds }),
};

// Submenus API endpoints
export const submenuEndpoints = {
  // GET /api/menus/visibles/:menuId/submenus
  getByMenu: (menuId: string) =>
    apiClient.get<BackendSubmenu[]>(`/api/menus/visibles/${menuId}/submenus`),
  // POST /api/submenus/visibles
  create: (data: CreateSubmenuRequest & { menusVisiblesId: string }) =>
    apiClient.post<BackendSubmenu>(`/api/submenus/visibles`, data),
  // PATCH /api/submenus/visibles/:submenuId
  update: (submenuId: string, data: UpdateSubmenuRequest) =>
    apiClient.patch<BackendSubmenu>(`/api/submenus/visibles/${submenuId}`, data),
  // PATCH /api/submenus/visibles/:submenuId/activo
  updateActiveStatus: (submenuId: string, activo: boolean) =>
    apiClient.patch<{ success: boolean; message?: string }>(`/api/submenus/visibles/${submenuId}/activo`, { activo }),
  // DELETE /api/submenus/visibles/:submenuId
  delete: (submenuId: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(`/api/submenus/visibles/${submenuId}`),
  // PUT /api/submenus/visibles/order
  updateOrder: (submenuIds: string[]) =>
    apiClient.put<{ success: boolean; message?: string }>("/api/submenus/visibles/order", { submenuIds }),
};

// Multimedia API endpoints
export const multimediaEndpoints = {
  // POST /api/multimedia/menus - Create/upload image for menu (first time)
  createMenuImage: (menuId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('menuId', menuId);
    formData.append('file', imageFile);

    const url = `${API_BASE_URL}/api/multimedia/menus`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      // Si la respuesta es exitosa (201 Created), considerar como éxito
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            data: data as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: typeof data?.message === 'string' ? data.message : "Imagen subida exitosamente",
          };
        } catch (jsonError) {
          // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: "Imagen subida exitosamente",
          };
        }
      } else {
        // Si la respuesta no es exitosa, intentar obtener el mensaje de error
        try {
          const data = await response.json();
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: typeof data?.message === 'string' ? data.message : (data?.error || "Error al subir la imagen"),
          };
        } catch (jsonError) {
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: `Error ${response.status}: ${response.statusText}`,
          };
        }
      }
    }).catch((error) => ({
      data: {} as { success: boolean; message?: string; imageUrl?: string },
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // PUT /api/multimedia/menus - Update image for menu (when image already exists)
  updateMenuImage: (menuId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('menuId', menuId);
    formData.append('file', imageFile);

    const url = `${API_BASE_URL}/api/multimedia/menus`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "PUT",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      // Si la respuesta es exitosa (200 OK o 201 Created), considerar como éxito
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            data: data as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: typeof data?.message === 'string' ? data.message : "Imagen actualizada exitosamente",
          };
        } catch (jsonError) {
          // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: "Imagen actualizada exitosamente",
          };
        }
      } else {
        // Si la respuesta no es exitosa, intentar obtener el mensaje de error
        try {
          const data = await response.json();
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: typeof data?.message === 'string' ? data.message : (data?.error || "Error al actualizar la imagen"),
          };
        } catch (jsonError) {
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: `Error ${response.status}: ${response.statusText}`,
          };
        }
      }
    }).catch((error) => ({
      data: {} as { success: boolean; message?: string; imageUrl?: string },
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // POST /api/multimedia/categorias - Create/upload image for category (first time)
  createCategoryImage: (categoryId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('categoriaId', categoryId);
    formData.append('file', imageFile);

    const url = `${API_BASE_URL}/api/multimedia/categorias`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      // Si la respuesta es exitosa (201 Created), considerar como éxito
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            data: data as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: typeof data?.message === 'string' ? data.message : "Imagen subida exitosamente",
          };
        } catch (jsonError) {
          // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: "Imagen subida exitosamente",
          };
        }
      } else {
        // Si la respuesta no es exitosa, intentar obtener el mensaje de error
        try {
          const data = await response.json();
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: typeof data?.message === 'string' ? data.message : (data?.error || "Error al subir la imagen"),
          };
        } catch (jsonError) {
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: `Error ${response.status}: ${response.statusText}`,
          };
        }
      }
    }).catch((error) => ({
      data: {} as { success: boolean; message?: string; imageUrl?: string },
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // PUT /api/multimedia/categorias - Update image for category (when image already exists)
  updateCategoryImage: (categoryId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('categoriaId', categoryId);
    formData.append('file', imageFile);

    const url = `${API_BASE_URL}/api/multimedia/categorias`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "PUT",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      // Si la respuesta es exitosa (200 OK o 201 Created), considerar como éxito
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            data: data as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: typeof data?.message === 'string' ? data.message : "Imagen actualizada exitosamente",
          };
        } catch (jsonError) {
          // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: "Imagen actualizada exitosamente",
          };
        }
      } else {
        // Si la respuesta no es exitosa, intentar obtener el mensaje de error
        try {
          const data = await response.json();
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: typeof data?.message === 'string' ? data.message : (data?.error || "Error al actualizar la imagen"),
          };
        } catch (jsonError) {
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: `Error ${response.status}: ${response.statusText}`,
          };
        }
      }
    }).catch((error) => ({
      data: {} as { success: boolean; message?: string; imageUrl?: string },
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // DELETE /api/multimedia/menus/:id - Delete menu image
  deleteMenuImage: (menuId: string) => {
    return apiClient.delete<{ success: boolean; message?: string }>(
      `/api/multimedia/menus/${menuId}`
    );
  },

  // DELETE /api/multimedia/categorias/:id - Delete category image
  deleteCategoryImage: (categoryId: string) => {
    return apiClient.delete<{ success: boolean; message?: string }>(
      `/api/multimedia/categorias/${categoryId}`
    );
  },

  // POST /api/multimedia/submenus - Create/upload image for submenu (first time)
  createSubmenuImage: (submenuId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('submenuId', submenuId);
    formData.append('file', imageFile);

    const url = `${API_BASE_URL}/api/multimedia/submenus`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      // Si la respuesta es exitosa (201 Created), considerar como éxito
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            data: data as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: typeof data?.message === 'string' ? data.message : "Imagen subida exitosamente",
          };
        } catch (jsonError) {
          // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: "Imagen subida exitosamente",
          };
        }
      } else {
        // Si la respuesta no es exitosa, intentar obtener el mensaje de error
        try {
          const data = await response.json();
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: typeof data?.message === 'string' ? data.message : (data?.error || "Error al subir la imagen"),
          };
        } catch (jsonError) {
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: `Error ${response.status}: ${response.statusText}`,
          };
        }
      }
    }).catch((error) => ({
      data: {} as { success: boolean; message?: string; imageUrl?: string },
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // PUT /api/multimedia/submenus - Update image for submenu (when image already exists)
  updateSubmenuImage: (submenuId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append('submenuId', submenuId);
    formData.append('file', imageFile);

    const url = `${API_BASE_URL}/api/multimedia/submenus`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "PUT",
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    }).then(async (response) => {
      // Si la respuesta es exitosa (200 OK o 201 Created), considerar como éxito
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            data: data as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: typeof data?.message === 'string' ? data.message : "Imagen actualizada exitosamente",
          };
        } catch (jsonError) {
          // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: true,
            message: "Imagen actualizada exitosamente",
          };
        }
      } else {
        // Si la respuesta no es exitosa, intentar obtener el mensaje de error
        try {
          const data = await response.json();
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: typeof data?.message === 'string' ? data.message : (data?.error || "Error al actualizar la imagen"),
          };
        } catch (jsonError) {
          return {
            data: {} as { success: boolean; message?: string; imageUrl?: string },
            success: false,
            message: `Error ${response.status}: ${response.statusText}`,
          };
        }
      }
    }).catch((error) => ({
      data: {} as { success: boolean; message?: string; imageUrl?: string },
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    }));
  },

  // DELETE /api/multimedia/submenus/:id - Delete submenu image
  deleteSubmenuImage: (submenuId: string) => {
    return apiClient.delete<{ success: boolean; message?: string }>(
      `/api/multimedia/submenus/${submenuId}`
    );
  },
};

// WhatsApp Templates API endpoints
export const whatsappTemplateEndpoints = {
  getAll: async () => {
    const response = await apiClient.get<BackendWhatsAppTemplate[] | { data: BackendWhatsAppTemplate[]; total?: number }>("/api/messaging/templates");

    // Handle both response formats: direct array or wrapped in { data: [...] }
    if (response.success && response.data) {
      // Check if data is already an array
      if (Array.isArray(response.data)) {
        return {
          ...response,
          data: response.data as BackendWhatsAppTemplate[],
        };
      }

      // If wrapped in { data: [...] }
      const wrappedData = response.data as { data: BackendWhatsAppTemplate[]; total?: number };
      if (wrappedData.data && Array.isArray(wrappedData.data)) {
        return {
          ...response,
          data: wrappedData.data,
        };
      }
    }

    return {
      ...response,
      data: [] as BackendWhatsAppTemplate[],
    };
  },
  getById: (id: string) => apiClient.get<BackendWhatsAppTemplate>(`/api/messaging/templates/${id}`),
  create: (payload: {
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: Array<any>;
  }) => apiClient.post<{ id: string; success: boolean; message?: string }>(
    "/api/messaging/templates",
    payload
  ),
  cleanDuplicates: () => apiClient.post<{ success: boolean; message?: string; removed?: number }>(
    "/api/messaging/templates/clean-duplicates"
  ),
  delete: (templateName: string) => apiClient.delete<{ success: boolean; message?: string }>(
    `/api/messaging/templates/${templateName}`
  ),
};

// Banner API endpoints
export const bannerEndpoints = {
  getAll: (params: { page: number; limit: number }) => {
    const searchParams = new URLSearchParams();
    searchParams.append('page', String(params.page));
    searchParams.append('limit', String(params.limit));
    const url = `/api/multimedia/banners?${searchParams.toString()}`;
    return apiClient.get<BannerPaginationData>(url);
  },

  getByPlacement: (placement: string) =>
    apiClient.get<BackendBanner[]>(`/api/multimedia/banners/placement/${placement}`),

  create: (formData: FormData) =>
    apiClient.postFormData<BackendBanner>('/api/multimedia/banners', formData),

  // Update usa el mismo endpoint POST pero con el campo 'id' en el FormData
  update: (formData: FormData) =>
    apiClient.postFormData<BackendBanner>('/api/multimedia/banners', formData),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(`/api/multimedia/banners/${id}`),
};

// Product Notifications API endpoints
export interface ProductNotification {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  stock: number;
  clientEmail?: string;
  clientPhone?: string;
  createdAt: string;
  notified: boolean;
}

export interface NotificationProducto {
  sku: string;
  totalNotificaciones: number;
  notificacionesPendientes: number;
  notificacionesEnviadas: number;
  emails: string[];
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
}

export interface NotificationGroup {
  codigoMarket: string;
  totalNotificaciones: number;
  productos: NotificationProducto[];
}

export interface GroupedNotificationsResponse {
  total: number;
  notificaciones: NotificationGroup[];
}

export const productNotificationEndpoints = {
  getAll: () => apiClient.get<ProductNotification[]>("/api/products/notifications"),
  getGrouped: () => apiClient.get<GroupedNotificationsResponse>("/api/messaging/notifications/grouped"),
  create: (data: { productId: string; clientEmail?: string; clientPhone?: string }) =>
    apiClient.post<{ success: boolean; message?: string }>("/api/products/notifications", data),
  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(`/api/products/notifications/${id}`),
  markAsNotified: (id: string) =>
    apiClient.patch<{ success: boolean; message?: string }>(`/api/products/notifications/${id}`, { notified: true }),
};

// Filter API endpoints
interface CreateFilterRequest {
  sectionName: string;
  column: string;
  operator?: string;
  operatorMode: "column" | "per-value";
  valueConfig: DynamicFilter["valueConfig"];
  displayType: string;
  scope: DynamicFilter["scope"];
  order: FilterOrderConfig;
  isActive: boolean;
}

interface UpdateFilterRequest extends Partial<CreateFilterRequest> {}

interface UpdateOrderRequest {
  scopeType: "category" | "menu" | "submenu";
  scopeId: string;
  filterOrders: Array<{
    filterId: string;
    order: number;
  }>;
}

interface DeleteBulkRequest {
  filterIds: string[];
}

export const filterEndpoints = {
  getAll: () => apiClient.get<DynamicFilter[]>("/api/filters"),
  getById: (id: string) => apiClient.get<DynamicFilter>(`/api/filters/${id}`),
  create: (data: CreateFilterRequest) => apiClient.post<DynamicFilter>("/api/filters", data),
  update: (id: string, data: UpdateFilterRequest) => apiClient.put<DynamicFilter>(`/api/filters/${id}`, data),
  updatePartial: (id: string, data: Partial<UpdateFilterRequest>) => apiClient.patch<DynamicFilter>(`/api/filters/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean; message?: string }>(`/api/filters/${id}`),
  deleteBulk: (data: DeleteBulkRequest) => apiClient.delete<{ success: boolean; message?: string; data?: { deletedCount: number } }>("/api/filters/bulk", data),
  updateOrder: (data: UpdateOrderRequest) => apiClient.put<{ success: boolean; message?: string; data?: { updatedFilters: Array<{ filterId: string; order: FilterOrderConfig }> } }>("/api/filters/order", data),
  updateFilterOrder: (id: string, order: FilterOrderConfig) => apiClient.patch<DynamicFilter>(`/api/filters/${id}/order`, { order }),
};

// User API endpoints
export interface CreateUserRequest {
  nombre: string;
  apellido: string;
  email: string;
  contrasena: string;
  fecha_nacimiento?: string;
  numero_documento?: string;
  tipo_documento?: string;
  telefono?: string;
  rol: string;
}

export interface CreateUserResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
  };
}

export interface BackendUser {
  id: string;
  uuid?: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: number | string;
  fecha_nacimiento?: string | null;
  numero_documento?: string;
  tipo_documento?: string;
  telefono?: string;
  codigo_pais?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithPermissions extends BackendUser {
  permisos: Array<{
    recurso: string;
    accion: string;
    permitido: boolean;
  }>;
}

export interface UpdateUserRequest {
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  numero_documento?: string;
  tipo_documento?: string;
  telefono?: string;
  rol?: string;
}

export interface UserSummaryResponse {
  total: number;
  rol_1: number; // Admin
  rol_2: number; // Usuario
  rol_3: number; // Invitado
  rol_4: number; // Super Admin
}

export const userEndpoints = {
  getAll: () =>
    apiClient.get<BackendUser[]>("/api/admin/users", true),
  getById: (userId: string) =>
    apiClient.get<UserWithPermissions>(`/api/admin/users/permisos/${userId}`, true),
  getSummary: () =>
    apiClient.get<UserSummaryResponse>("/api/admin/users/summary", true),
  create: (data: CreateUserRequest) =>
    apiClient.post<CreateUserResponse>("/api/admin/users/add", data, true),
  update: (userId: string, data: UpdateUserRequest) =>
    apiClient.put<{ success: boolean; message?: string }>("/api/admin/users/update", { id: userId, updateData: data }, true),
  updatePermissions: (payload: { userId: string; permisos: Array<{ recurso: string; accion: string; permitido: boolean }> }) =>
    apiClient.post<{ success: boolean; message?: string }>("/api/admin/users/permisos", payload, true),
};

export interface BackendTienda {
  codigo: string;
  descripcion?: string;
  departamento?: string;
  ciudad?: string;
  direccion?: string;
  place_ID?: string;
  ubicacion_cc?: string;
  horario?: string;
  telefono?: string;
  extension?: string;
  email?: string;
  codBodega: string;
  codDane?: string;
  latitud?: string;
  longitud?: string;
}

export const tiendasEndpoints = {
  getAll: () =>
    apiClient.get<BackendTienda[]>("/api/stores"),
};
