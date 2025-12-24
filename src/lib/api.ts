/**
 * Cliente API para comunicación con microservicios
 * - Configuración base de Axios o Fetch
 * - Interceptors para auth tokens
 * - Manejo centralizado de errores
 * - Retry logic para requests fallidos
 * - Rate limiting y caching
 * - TypeScript interfaces para requests/responses
 */

import { apiClientFormData, getApiKey } from "@/lib/api-client";
import {
  BackendCategory,
  BackendMenu,
  BackendSubmenu,
  BackendWhatsAppTemplate,
  CreateCategoryRequest,
  CreateMenuRequest,
  CreateSubmenuRequest,
  UpdateCategoryRequest,
  UpdateMenuRequest,
  UpdateSubmenuRequest,
} from "@/types";
import { BackendBanner, BannerPaginationData } from "@/types/banner";
import {
  DisplayTypesResponse,
  DynamicFilter,
  FilterOperator,
  FilterOrderConfig,
  ProductColumn,
} from "@/types/filters";
import type {
  CreateCompletePageRequest,
  CreateCompletePageResponse,
  Page,
  PageExpanded,
  PagePaginationData,
} from "@/types/page";
import type { ProductCard, UpdateProductCardDto } from "@/types/product-card";

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
      "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
    };
  }

  // Helper para obtener el token de localStorage
  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("imagiq_token");
    }
    return null;
  }

  // Helper para agregar el token de autorización a los headers
  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();

    if (token) {
      return {
        ...this.headers,
        Authorization: `Bearer ${token}`,
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
    const headers = useAuth ? this.getAuthHeaders() : this.headers;
    
    // Log request details for filter order endpoint
    if (endpoint.includes("/filters/order")) {
      console.log("[Request] ========== FILTER ORDER REQUEST ==========");
      console.log("[Request] URL:", url);
      console.log("[Request] Method:", options.method || "GET");
      console.log("[Request] Headers:", JSON.stringify(headers, null, 2));
      console.log("[Request] Body (raw):", options.body);
      console.log("[Request] Body (type):", typeof options.body);
      if (options.body && typeof options.body === 'string') {
        try {
          const parsedBody = JSON.parse(options.body);
          console.log("[Request] Body (parsed):", JSON.stringify(parsedBody, null, 2));
        } catch (e) {
          console.log("[Request] Body is not valid JSON");
        }
      }
      console.log("[Request] ==========================================");
    }
    
    const config: RequestInit = {
      headers: headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Leer el body de la respuesta una sola vez
      let responseText = "";
      let data: any = {};
      
      try {
        responseText = await response.text();
        if (responseText) {
      try {
            data = JSON.parse(responseText);
      } catch (jsonError) {
            // Si no es JSON válido, usar el texto como mensaje
            data = { message: responseText, error: responseText };
          }
        }
      } catch (error) {
        // Si no se puede leer el body, retornar error
        console.error("Error reading response:", error, {
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

      // Log errores del servidor para debugging
      if (!response.ok) {
        const errorDetails = {
          url,
          status: response.status,
          statusText: response.statusText,
          errorBody: data,
          responseText: responseText ? responseText.substring(0, 500) : "(empty)", // Primeros 500 caracteres
        };
        
        // Si es un error 400, mostrar más detalles
        if (response.status === 400) {
          console.error(`[API Error 400] Bad Request - Detalles completos:`, errorDetails);
          if (data && typeof data === 'object') {
            console.error(`[API Error 400] Mensaje del servidor:`, data);
          }
        } else {
          console.error(`[API Error] ${response.status} ${response.statusText}`, errorDetails);
        }
      }

      // Detectar error 401 y cerrar sesión automáticamente
      if (response.status === 401 && useAuth) {
        console.warn(
          "[Auth] Token inválido o expirado detectado. Cerrando sesión..."
        );

        // Limpiar localStorage y redirigir al login
        if (
          typeof globalThis !== "undefined" &&
          typeof localStorage !== "undefined"
        ) {
          localStorage.removeItem("imagiq_token");
          localStorage.removeItem("imagiq_user");
          globalThis.location.href = "/login";
        }
      }

      // Log errores 500 con más detalle
      if (!response.ok && response.status >= 500) {
        console.error(`[Backend Error] ${response.status}`, {
          url,
          endpoint,
          data,
          message:
            data?.message || data?.error || "Error desconocido del servidor",
        });
      }

      return {
        data: data as T,
        success: response.ok,
        message:
          typeof data?.message === "string"
            ? data.message
            : typeof data?.error === "string"
            ? data.error
            : undefined,
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
  async get<T>(
    endpoint: string,
    useAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" }, useAuth);
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    useAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      useAuth
    );
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    useAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    // Log the request data for debugging
    if (endpoint.includes("/filters/order")) {
      console.log("[PUT Request] Endpoint:", endpoint);
      console.log("[PUT Request] Data object:", data);
      console.log("[PUT Request] Data JSON:", JSON.stringify(data, null, 2));
      console.log("[PUT Request] Data type:", typeof data);
    }
    return this.request<T>(
      endpoint,
      {
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      },
      useAuth
    );
  }

  async delete<T>(
    endpoint: string,
    data?: unknown,
    useAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "DELETE",
        body: data ? JSON.stringify(data) : undefined,
      },
      useAuth
    );
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    useAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      useAuth
    );
  }

  async postFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const apiKey = getApiKey();
    const config: RequestInit = {
      method: "POST",
      body: formData,
      headers: {
        // No incluir Content-Type para que el browser lo establezca automáticamente con boundary
        ...(apiKey && { "X-API-Key": apiKey }),
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
        message: typeof data?.message === "string" ? data.message : undefined,
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

  async putFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const apiKey = getApiKey();
    const config: RequestInit = {
      method: "PUT",
      body: formData,
      headers: {
        // No incluir Content-Type para que el browser lo establezca automáticamente con boundary
        ...(apiKey && { "X-API-Key": apiKey }),
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
        message: typeof data?.message === "string" ? data.message : undefined,
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
  getById: (id: string) =>
    apiClient.get<ProductApiResponse>(`/api/products/${id}`),
  getByCategory: (category: string) =>
    apiClient.get<ProductApiResponse>(
      `/api/products/filtered?categoria=${category}`
    ),
  getByMenu: (menu: string) =>
    apiClient.get<ProductApiResponse>(`/api/products/filtered?menu=${menu}`),
  getByCodigoMarket: (codigoMarket: string) =>
    apiClient.get<ProductApiResponse2>(
      `/api/products/filtered?codigoMarket=${codigoMarket}`
    ),
  search: (query: string) =>
    apiClient.get<ProductApiResponse>(`/api/products/filtered?nombre=${query}`),
  getSummary: () => apiClient.get<ProductSummary>("/api/products/summary"),
  getColumnNames: () =>
    apiClient.get<ProductColumn[]>("/api/products/columns/metadata"),
  getDistinctValues: (
    columnKey: string,
    params?: { categoria?: string; menu?: string; submenu?: string }
  ) => {
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
    const url = `/api/products/distinct/${columnKey}${
      queryString ? `?${queryString}` : ""
    }`;
    return apiClient.get<string[]>(url);
  },
  getDisplayTypes: (columnKey: string, operator?: FilterOperator) => {
    const searchParams = new URLSearchParams();
    if (operator) {
      searchParams.append("operator", operator);
    }
    const queryString = searchParams.toString();
    const url = `/api/products/columns/${columnKey}/display-types${
      queryString ? `?${queryString}` : ""
    }`;
    return apiClient.get<DisplayTypesResponse>(url);
  },
  updateMedia: (id: string, data: ProductMediaUpdateData) =>
    apiClient.put<ProductMediaUpdateResponse>(
      `/api/products/${id}/media`,
      data
    ),
  getMultimedia: (sku: string) =>
    apiClient.get<ProductMultimediaData>(
      `/api/multimedia/producto/${encodeSkuForPath(sku)}`
    ),

  // Modificar imagen en posición específica
  updateImageAtPosition: (sku: string, numero: number, imageFile: File) => {
    const formData = new FormData();
    formData.append("file", imageFile);

    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(
      `${API_BASE_URL}/api/multimedia/producto/${safeSku}/imagen/${numero}`,
      {
        method: "PUT",
        body: formData,
        headers: {
          ...(apiKey && { "X-API-Key": apiKey }),
        },
      }
    )
      .then(async (response) => {
        const data = await response.json();
        return {
          data,
          success: response.ok,
          message:
            typeof data?.message === "string"
              ? data.message
              : data?.error || "Error desconocido",
        };
      })
      .catch((error) => ({
        data: {},
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      }));
  },

  // Agregar una imagen al final
  addImage: (sku: string, imageFile: File) => {
    const formData = new FormData();
    formData.append("file", imageFile);

    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(
      `${API_BASE_URL}/api/multimedia/producto/${safeSku}/imagen/agregar`,
      {
        method: "POST",
        body: formData,
        headers: {
          ...(apiKey && { "X-API-Key": apiKey }),
        },
      }
    )
      .then(async (response) => {
        const data = await response.json();
        return {
          data,
          success: response.ok,
          message:
            typeof data?.message === "string"
              ? data.message
              : data?.error || "Error desconocido",
        };
      })
      .catch((error) => ({
        data: {},
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      }));
  },

  // Agregar varias imágenes al final
  addMultipleImages: (sku: string, imageFiles: File[]) => {
    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append("files", file);
    });

    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(
      `${API_BASE_URL}/api/multimedia/producto/${safeSku}/imagenes/agregar-multiples`,
      {
        method: "POST",
        body: formData,
        headers: {
          ...(apiKey && { "X-API-Key": apiKey }),
        },
      }
    )
      .then(async (response) => {
        const data = await response.json();
        return {
          data,
          success: response.ok,
          message:
            typeof data?.message === "string"
              ? data.message
              : data?.error || "Error desconocido",
        };
      })
      .catch((error) => ({
        data: {},
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      }));
  },

  // Subir múltiples imágenes usando multiple_data (preview + detalles)
  // Si previewFile es null, mantiene la preview existente
  uploadMultipleData: (
    sku: string,
    previewFile: File | null,
    detailFiles: File[]
  ) => {
    const formData = new FormData();

    // Agregar SKU
    formData.append("sku", sku);

    // Agregar preview (Blob vacío si no se modifica)
    if (previewFile) {
      formData.append("file", previewFile);
    } else {
      // Enviar un Blob vacío para indicar que no se modifica la preview
      formData.append("file", new Blob(), "");
    }

    // Agregar imágenes de detalle
    detailFiles.forEach((file) => {
      formData.append("file", file);
    });

    const apiKey = getApiKey();
    return fetch(`${API_BASE_URL}/api/multimedia/producto/multiple_data`, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { "X-API-Key": apiKey }),
      },
    })
      .then(async (response) => {
        const data = await response.json();
        return {
          data,
          success: response.ok,
          message:
            typeof data?.message === "string"
              ? data.message
              : data?.error || "Error desconocido",
        };
      })
      .catch((error) => ({
        data: {},
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      }));
  },

  // Obtener videos premium
  getPremiumVideos: (sku: string) =>
    apiClient.get<{ videos: string[] }>(
      `/api/multimedia/producto/${sku}/premium-videos`
    ),

  // Obtener imágenes premium
  getPremiumImages: (sku: string) =>
    apiClient.get<{ images: string[] }>(
      `/api/multimedia/producto/${sku}/premium-images`
    ),

  // Reordenar imágenes existentes
  reorderImages: (sku: string, imageUrls: string[]) => {
    const safeSku = encodeSkuForPath(sku);
    return apiClient.put<{ success: boolean; message: string }>(
      `/api/multimedia/producto/${safeSku}/reordenar`,
      {
        sku: safeSku,
        imageUrls,
      }
    );
  },

  // Eliminar una o varias imágenes de detalle
  deleteDetailImages: (sku: string, numeros: number[]) => {
    const safeSku = encodeSkuForPath(sku);
    const apiKey = getApiKey();
    return fetch(
      `${API_BASE_URL}/api/multimedia/producto/${safeSku}/imagenes-detalle`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey && { "X-API-Key": apiKey }),
        },
        body: JSON.stringify({ numeros }),
      }
    )
      .then(async (response) => {
        const data = await response.json();
        return {
          data,
          success: response.ok,
          message:
            typeof data?.message === "string"
              ? data.message
              : data?.error || "Error desconocido",
        };
      })
      .catch((error) => ({
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
        ...(apiKey && { "X-API-Key": apiKey }),
      },
    })
      .then(async (response) => {
        const data = await response.json();
        return {
          data,
          success: response.ok,
          message:
            typeof data?.message === "string"
              ? data.message
              : data?.error || "Error desconocido",
        };
      })
      .catch((error) => ({
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
  submenu?: string;
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
  getVisibleCompletas: () =>
    apiClient.get<BackendCategory[]>("/api/categorias/visibles/completas"),
  getDistinct: () => apiClient.get<string[]>("/api/categorias/distinct"),
  create: (data: CreateCategoryRequest) =>
    apiClient.post<BackendCategory>("/api/categorias/visibles", data),
  update: (uuid: string, data: UpdateCategoryRequest) =>
    apiClient.patch<BackendCategory>(`/api/categorias/visibles/${uuid}`, data),
  updateActiveStatus: (uuid: string, activo: boolean) =>
    apiClient.patch<{ success: boolean; message?: string }>(
      `/api/categorias/visibles/${uuid}/activo`,
      { activo }
    ),
  delete: (uuid: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(
      `/api/categorias/visibles/${uuid}`
    ),
  sync: () =>
    apiClient.post<{ success: boolean; message?: string }>(
      "/api/categorias/sync"
    ),
  updateOrder: (categoryIds: string[]) =>
    apiClient.put<{ success: boolean; message?: string }>(
      "/api/categorias/visibles/order",
      { categoryIds }
    ),
};

// Menus API endpoints
export const menuEndpoints = {
  // GET /api/categorias/visibles/:categoryId/menus
  getByCategory: (categoryId: string) =>
    apiClient.get<BackendMenu[]>(
      `/api/categorias/visibles/${categoryId}/menus`
    ),
  // GET /api/categorias/distinct/menus?categoria=CATEGORIA_NAME
  getDistinct: (categoryName: string) =>
    apiClient.get<string[]>(
      `/api/categorias/distinct/menus?categoria=${encodeURIComponent(
        categoryName
      )}`
    ),
  // POST /api/menus/visibles
  create: (data: CreateMenuRequest & { categoriasVisiblesId: string }) =>
    apiClient.post<BackendMenu>(`/api/menus/visibles`, data),
  // PATCH /api/menus/visibles/:menuId
  update: (menuId: string, data: UpdateMenuRequest) =>
    apiClient.patch<BackendMenu>(`/api/menus/visibles/${menuId}`, data),
  // PATCH /api/menus/visibles/:menuId/activo
  updateActiveStatus: (menuId: string, activo: boolean) =>
    apiClient.patch<{ success: boolean; message?: string }>(
      `/api/menus/visibles/${menuId}/activo`,
      { activo }
    ),
  // DELETE /api/menus/visibles/:menuId
  delete: (menuId: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(
      `/api/menus/visibles/${menuId}`
    ),
  // PUT /api/menus/visibles/order
  updateOrder: (menuIds: string[]) =>
    apiClient.put<{ success: boolean; message?: string }>(
      "/api/menus/visibles/order",
      { menuIds }
    ),
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
    apiClient.patch<BackendSubmenu>(
      `/api/submenus/visibles/${submenuId}`,
      data
    ),
  // PATCH /api/submenus/visibles/:submenuId/activo
  updateActiveStatus: (submenuId: string, activo: boolean) =>
    apiClient.patch<{ success: boolean; message?: string }>(
      `/api/submenus/visibles/${submenuId}/activo`,
      { activo }
    ),
  // DELETE /api/submenus/visibles/:submenuId
  delete: (submenuId: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(
      `/api/submenus/visibles/${submenuId}`
    ),
  // PUT /api/submenus/visibles/order
  updateOrder: (submenuIds: string[]) =>
    apiClient.put<{ success: boolean; message?: string }>(
      "/api/submenus/visibles/order",
      { submenuIds }
    ),
};

// Multimedia API endpoints
export const multimediaEndpoints = {
  // POST /api/multimedia/menus - Create/upload image for menu (first time)
  createMenuImage: (menuId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append("menuId", menuId);
    formData.append("file", imageFile);

    const url = `${API_BASE_URL}/api/multimedia/menus`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { "X-API-Key": apiKey }),
      },
    })
      .then(async (response) => {
        // Si la respuesta es exitosa (201 Created), considerar como éxito
        if (response.ok) {
          try {
            const data = await response.json();
            return {
              data: data as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : "Imagen subida exitosamente",
            };
          } catch (jsonError) {
            // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message: "Imagen subida exitosamente",
            };
          }
        } else {
          // Si la respuesta no es exitosa, intentar obtener el mensaje de error
          try {
            const data = await response.json();
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : data?.error || "Error al subir la imagen",
            };
          } catch (jsonError) {
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message: `Error ${response.status}: ${response.statusText}`,
            };
          }
        }
      })
      .catch((error) => ({
        data: {} as { success: boolean; message?: string; imageUrl?: string },
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      }));
  },

  // PUT /api/multimedia/menus - Update image for menu (when image already exists)
  updateMenuImage: (menuId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append("menuId", menuId);
    formData.append("file", imageFile);

    const url = `${API_BASE_URL}/api/multimedia/menus`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "PUT",
      body: formData,
      headers: {
        ...(apiKey && { "X-API-Key": apiKey }),
      },
    })
      .then(async (response) => {
        // Si la respuesta es exitosa (200 OK o 201 Created), considerar como éxito
        if (response.ok) {
          try {
            const data = await response.json();
            return {
              data: data as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : "Imagen actualizada exitosamente",
            };
          } catch (jsonError) {
            // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message: "Imagen actualizada exitosamente",
            };
          }
        } else {
          // Si la respuesta no es exitosa, intentar obtener el mensaje de error
          try {
            const data = await response.json();
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : data?.error || "Error al actualizar la imagen",
            };
          } catch (jsonError) {
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message: `Error ${response.status}: ${response.statusText}`,
            };
          }
        }
      })
      .catch((error) => ({
        data: {} as { success: boolean; message?: string; imageUrl?: string },
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      }));
  },

  // POST /api/multimedia/categorias - Create/upload image for category (first time)
  createCategoryImage: (categoryId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append("categoriaId", categoryId);
    formData.append("file", imageFile);

    const url = `${API_BASE_URL}/api/multimedia/categorias`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { "X-API-Key": apiKey }),
      },
    })
      .then(async (response) => {
        // Si la respuesta es exitosa (201 Created), considerar como éxito
        if (response.ok) {
          try {
            const data = await response.json();
            return {
              data: data as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : "Imagen subida exitosamente",
            };
          } catch (jsonError) {
            // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message: "Imagen subida exitosamente",
            };
          }
        } else {
          // Si la respuesta no es exitosa, intentar obtener el mensaje de error
          try {
            const data = await response.json();
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : data?.error || "Error al subir la imagen",
            };
          } catch (jsonError) {
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message: `Error ${response.status}: ${response.statusText}`,
            };
          }
        }
      })
      .catch((error) => ({
        data: {} as { success: boolean; message?: string; imageUrl?: string },
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      }));
  },

  // PUT /api/multimedia/categorias - Update image for category (when image already exists)
  updateCategoryImage: (categoryId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append("categoriaId", categoryId);
    formData.append("file", imageFile);

    const url = `${API_BASE_URL}/api/multimedia/categorias`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "PUT",
      body: formData,
      headers: {
        ...(apiKey && { "X-API-Key": apiKey }),
      },
    })
      .then(async (response) => {
        // Si la respuesta es exitosa (200 OK o 201 Created), considerar como éxito
        if (response.ok) {
          try {
            const data = await response.json();
            return {
              data: data as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : "Imagen actualizada exitosamente",
            };
          } catch (jsonError) {
            // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message: "Imagen actualizada exitosamente",
            };
          }
        } else {
          // Si la respuesta no es exitosa, intentar obtener el mensaje de error
          try {
            const data = await response.json();
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : data?.error || "Error al actualizar la imagen",
            };
          } catch (jsonError) {
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message: `Error ${response.status}: ${response.statusText}`,
            };
          }
        }
      })
      .catch((error) => ({
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
    formData.append("submenuId", submenuId);
    formData.append("file", imageFile);

    const url = `${API_BASE_URL}/api/multimedia/submenus`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        ...(apiKey && { "X-API-Key": apiKey }),
      },
    })
      .then(async (response) => {
        // Si la respuesta es exitosa (201 Created), considerar como éxito
        if (response.ok) {
          try {
            const data = await response.json();
            return {
              data: data as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : "Imagen subida exitosamente",
            };
          } catch (jsonError) {
            // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message: "Imagen subida exitosamente",
            };
          }
        } else {
          // Si la respuesta no es exitosa, intentar obtener el mensaje de error
          try {
            const data = await response.json();
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : data?.error || "Error al subir la imagen",
            };
          } catch (jsonError) {
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message: `Error ${response.status}: ${response.statusText}`,
            };
          }
        }
      })
      .catch((error) => ({
        data: {} as { success: boolean; message?: string; imageUrl?: string },
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      }));
  },

  // PUT /api/multimedia/submenus - Update image for submenu (when image already exists)
  updateSubmenuImage: (submenuId: string, imageFile: File) => {
    const formData = new FormData();
    formData.append("submenuId", submenuId);
    formData.append("file", imageFile);

    const url = `${API_BASE_URL}/api/multimedia/submenus`;
    const apiKey = getApiKey();
    return fetch(url, {
      method: "PUT",
      body: formData,
      headers: {
        ...(apiKey && { "X-API-Key": apiKey }),
      },
    })
      .then(async (response) => {
        // Si la respuesta es exitosa (200 OK o 201 Created), considerar como éxito
        if (response.ok) {
          try {
            const data = await response.json();
            return {
              data: data as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : "Imagen actualizada exitosamente",
            };
          } catch (jsonError) {
            // Si no se puede parsear JSON pero la respuesta es exitosa, considerar como éxito
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: true,
              message: "Imagen actualizada exitosamente",
            };
          }
        } else {
          // Si la respuesta no es exitosa, intentar obtener el mensaje de error
          try {
            const data = await response.json();
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message:
                typeof data?.message === "string"
                  ? data.message
                  : data?.error || "Error al actualizar la imagen",
            };
          } catch (jsonError) {
            return {
              data: {} as {
                success: boolean;
                message?: string;
                imageUrl?: string;
              },
              success: false,
              message: `Error ${response.status}: ${response.statusText}`,
            };
          }
        }
      })
      .catch((error) => ({
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
    const response = await apiClient.get<
      | BackendWhatsAppTemplate[]
      | { data: BackendWhatsAppTemplate[]; total?: number }
    >("/api/messaging/templates");

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
      const wrappedData = response.data as {
        data: BackendWhatsAppTemplate[];
        total?: number;
      };
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
  getById: (id: string) =>
    apiClient.get<BackendWhatsAppTemplate>(`/api/messaging/templates/${id}`),
  create: (payload: {
    name: string;
    category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
    language: string;
    components: Array<any>;
  }) =>
    apiClient.post<{ id: string; success: boolean; message?: string }>(
      "/api/messaging/templates",
      payload
    ),
  cleanDuplicates: () =>
    apiClient.post<{ success: boolean; message?: string; removed?: number }>(
      "/api/messaging/templates/clean-duplicates"
    ),
  delete: (templateName: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(
      `/api/messaging/templates/${templateName}`
    ),
};

// Banner API endpoints
export const bannerEndpoints = {
  getAll: (params: { page: number; limit: number }) => {
    const searchParams = new URLSearchParams();
    searchParams.append("page", String(params.page));
    searchParams.append("limit", String(params.limit));
    const url = `/api/multimedia/banners?${searchParams.toString()}`;
    return apiClient.get<BannerPaginationData>(url);
  },

  getByPlacement: (placement: string) =>
    apiClient.get<BackendBanner[]>(
      `/api/multimedia/banners/placement/${placement}`
    ),

  create: (formData: FormData) =>
    apiClient.postFormData<BackendBanner>("/api/multimedia/banners", formData),

  // Update usa el mismo endpoint POST pero con el campo 'id' en el FormData
  update: (formData: FormData) =>
    apiClient.postFormData<BackendBanner>("/api/multimedia/banners", formData),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(
      `/api/multimedia/banners/${id}`
    ),

  updateOrder: (payload: { placement: string; bannerOrders: Array<{ id: string; display_order: number }> }) =>
    apiClient.patch<{ message: string }>(
      "/api/multimedia/banners/order",
      payload
    ),

  getPlacements: () =>
    apiClient.get<string[]>("/api/multimedia/banners/placements"),

  getStats: () =>
    apiClient.get<{
      total: number;
      activos: number;
      inactivos: number;
    }>("/api/multimedia/banners/stats"),
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
  getAll: () =>
    apiClient.get<ProductNotification[]>("/api/products/notifications"),
  getGrouped: () =>
    apiClient.get<GroupedNotificationsResponse>(
      "/api/messaging/notifications/grouped"
    ),
  create: (data: {
    productId: string;
    clientEmail?: string;
    clientPhone?: string;
  }) =>
    apiClient.post<{ success: boolean; message?: string }>(
      "/api/products/notifications",
      data
    ),
  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(
      `/api/products/notifications/${id}`
    ),
  markAsNotified: (id: string) =>
    apiClient.patch<{ success: boolean; message?: string }>(
      `/api/products/notifications/${id}`,
      { notified: true }
    ),
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
  create: (data: CreateFilterRequest) =>
    apiClient.post<DynamicFilter>("/api/filters", data),
  update: (id: string, data: UpdateFilterRequest) =>
    apiClient.put<DynamicFilter>(`/api/filters/${id}`, data),
  updatePartial: (id: string, data: Partial<UpdateFilterRequest>) =>
    apiClient.patch<DynamicFilter>(`/api/filters/${id}`, data),
  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message?: string }>(
      `/api/filters/${id}`
    ),
  deleteBulk: (data: DeleteBulkRequest) =>
    apiClient.delete<{
      success: boolean;
      message?: string;
      data?: { deletedCount: number };
    }>("/api/filters/bulk", data),
  updateOrder: (data: UpdateOrderRequest) => {
    // El backend espera todo en el body: scopeType, scopeId y filterOrders
    const body = {
      scopeType: data.scopeType,
      scopeId: data.scopeId,
      filterOrders: data.filterOrders,
    };
    
    console.log("[updateOrder] Body completo:", JSON.stringify(body, null, 2));
    
    return apiClient.put<{
      success: boolean;
      message?: string;
      data?: {
        updatedFilters: Array<{ filterId: string; order: FilterOrderConfig }>;
      };
    }>("/api/filters/order", body);
  },
  updateFilterOrder: (id: string, order: FilterOrderConfig) =>
    apiClient.patch<DynamicFilter>(`/api/filters/${id}/order`, { order }),
  getByContext: (params: { categoriaUuid: string; menuUuid?: string; submenuUuid?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.append("categoriaUuid", params.categoriaUuid);
    if (params.menuUuid) searchParams.append("menuUuid", params.menuUuid);
    if (params.submenuUuid) searchParams.append("submenuUuid", params.submenuUuid);
    return apiClient.get<DynamicFilter[]>(`/api/filters/by-context?${searchParams.toString()}`);
  },
  getByHierarchy: (params: { categoriaUuid?: string; menuUuid?: string; submenuUuid?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.categoriaUuid) searchParams.append("categoriaUuid", params.categoriaUuid);
    if (params.menuUuid) searchParams.append("menuUuid", params.menuUuid);
    if (params.submenuUuid) searchParams.append("submenuUuid", params.submenuUuid);
    return apiClient.get<{
      categoryFilters: DynamicFilter[];
      menuFilters: DynamicFilter[];
      submenuFilters: DynamicFilter[];
    }>(`/api/filters/by-hierarchy?${searchParams.toString()}`);
  },
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
  getAll: () => apiClient.get<BackendUser[]>("/api/admin/users", true),
  getById: (userId: string) =>
    apiClient.get<UserWithPermissions>(
      `/api/admin/users/permisos/${userId}`,
      true
    ),
  getSummary: () =>
    apiClient.get<UserSummaryResponse>("/api/admin/users/summary", true),
  create: (data: CreateUserRequest) =>
    apiClient.post<CreateUserResponse>("/api/admin/users/add", data, true),
  update: (userId: string, data: UpdateUserRequest) =>
    apiClient.put<{ success: boolean; message?: string }>(
      "/api/admin/users/update",
      { id: userId, updateData: data },
      true
    ),
  updatePermissions: (payload: {
    userId: string;
    permisos: Array<{ recurso: string; accion: string; permitido: boolean }>;
  }) =>
    apiClient.post<{ success: boolean; message?: string }>(
      "/api/admin/users/permisos",
      payload,
      true
    ),
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
  getAll: () => apiClient.get<BackendTienda[]>("/api/stores"),
};

// ============ OFERTAS DESTACADAS ============
export interface OfertaDestacada {
  uuid: string;
  codigo_market: string;
  nombre?: string | null; // Nombre que se muestra (puede ser market o modelo)
  nombre_market?: string | null; // Nombre de market (siempre disponible)
  nombre_modelo?: string | null; // Nombre de modelo (siempre disponible)
  orden: number;
  activo: boolean;
  categoria_id?: string | null; // ✅ NUEVO: ID de la categoría asociada
  categoria?: {
    uuid: string;
    nombre: string;
    nombreVisible: string;
    descripcion: string;
    imagen: string;
    activo: boolean;
  } | null; // ✅ NUEVO: Datos de la categoría
  created_at: string;
  updated_at: string;
  producto?: {
    codigoMarket: string;
    nombreMarket: string;
    imagen: string;
    categoria: string;
    menu: string;
    sku: string;
  };
}

export interface CreateOfertaDestacadaDto {
  codigo_market: string;
  nombre?: string;
  orden?: number;
  activo?: boolean;
  categoria_id?: string; // ✅ NUEVO: ID de la categoría
}

export interface UpdateOfertaDestacadaDto {
  orden?: number;
  activo?: boolean;
  categoria_id?: string; // ✅ NUEVO: ID de la categoría
}

export type UpdateOrderDto = Array<{
  uuid: string;
  orden: number;
}>;

export interface OfertasDestacadasStats {
  total: number;
  activas: number;
}

export const ofertasDestacadasEndpoints = {
  // Obtener todas (para dashboard) - ya trae datos enriquecidos del producto
  getAll: () =>
    apiClient.get<OfertaDestacada[]>("/api/products/ofertas-destacadas/direct"),

  // Obtener solo activas (para frontend público) - ya trae datos enriquecidos
  getActive: () =>
    apiClient.get<OfertaDestacada[]>(
      "/api/products/ofertas-destacadas/activas/direct"
    ),

  // Crear nueva oferta
  create: (data: CreateOfertaDestacadaDto) =>
    apiClient.post<OfertaDestacada>("/api/products/ofertas-destacadas", data),

  // Actualizar oferta
  update: (uuid: string, data: UpdateOfertaDestacadaDto) =>
    apiClient.put<OfertaDestacada>(
      `/api/products/ofertas-destacadas/${uuid}`,
      data
    ),

  // Eliminar oferta
  delete: (uuid: string) =>
    apiClient.delete<void>(`/api/products/ofertas-destacadas/${uuid}`),

  // Actualizar nombre de oferta
  updateNombre: (uuid: string, tipoNombre: "market" | "modelo") =>
    apiClient.put<OfertaDestacada>(
      `/api/products/ofertas-destacadas/${uuid}/nombre`,
      { tipo_nombre: tipoNombre }
    ),

  // Actualizar orden (drag & drop)
  reorder: (data: UpdateOrderDto) =>
    apiClient.put<OfertaDestacada[]>(
      "/api/products/ofertas-destacadas/reorder",
      data
    ),

  // Obtener estadísticas
  getStats: () =>
    apiClient.get<OfertasDestacadasStats>(
      "/api/products/ofertas-destacadas/stats"
    ),
};

// Pages API endpoints
export const pageEndpoints = {
  // Listar todas las páginas con paginación
  getAll: (params: { page: number; limit: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.append("page", String(params.page));
    searchParams.append("limit", String(params.limit));
    if (params.status) searchParams.append("status", params.status);
    const url = `/api/multimedia/pages?${searchParams.toString()}`;
    return apiClient.get<PagePaginationData>(url);
  },

  // Listar documentos legales (T&C, políticas, etc.)
  getLegal: (params: { page: number; limit: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.append("page", String(params.page));
    searchParams.append("limit", String(params.limit));
    if (params.status) searchParams.append("status", params.status);
    const url = `/api/multimedia/pages/legal?${searchParams.toString()}`;
    return apiClient.get<PagePaginationData>(url);
  },

  // Obtener página por ID con relaciones expandidas
  getById: (id: string, expand?: string[]) => {
    const searchParams = new URLSearchParams();
    if (expand && expand.length > 0) {
      searchParams.append("expand", expand.join(","));
    }
    const url = `/api/multimedia/pages/${id}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    return apiClient.get<{ success: boolean; data: PageExpanded }>(url);
  },

  // Obtener página por slug (público)
  getBySlug: (slug: string, expand?: string[]) => {
    const searchParams = new URLSearchParams();
    if (expand && expand.length > 0) {
      searchParams.append("expand", expand.join(","));
    }
    const url = `/api/multimedia/pages/slug/${slug}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    return apiClient.get<{ success: boolean; data: PageExpanded }>(url);
  },

  // Crear página completa con banners y FAQs (transaccional)
  createComplete: (data: CreateCompletePageRequest) => {
    const formData = new FormData();

    console.log("Construyendo FormData:", {
      page_keys: Object.keys(data.page),
      new_banners_count: data.new_banners.length,
      banner_files_count: data.banner_files.length,
    });

    // 1. Agregar datos de la página como JSON string
    formData.append("page", JSON.stringify(data.page));

    // 2. Agregar new_banners como JSON string (sin archivos)
    formData.append("new_banners", JSON.stringify(data.new_banners));

    // 3. Agregar existing_banner_ids como JSON string
    formData.append(
      "existing_banner_ids",
      JSON.stringify(data.existing_banner_ids)
    );

    // 3.5. Agregar banner_updates si existen (para drag & drop y otros cambios en banners existentes)
    if (data.banner_updates && data.banner_updates.length > 0) {
      formData.append("banner_updates", JSON.stringify(data.banner_updates));
    }

    // 4. Agregar new_faqs como JSON string
    formData.append("new_faqs", JSON.stringify(data.new_faqs));

    // 5. Agregar existing_faq_ids como JSON string
    formData.append("existing_faq_ids", JSON.stringify(data.existing_faq_ids));

    // 6. Agregar archivos de banners
    // Para nuevos banners: banner_0_desktop_image, banner_1_desktop_image, etc.
    // Para banners existentes: banner_{ID}_desktop_image donde ID es el UUID del banner
    data.banner_files.forEach((files: any, index) => {
      // Si tiene banner_id, es un banner existente - usar el ID del banner
      const prefix = files.banner_id
        ? `banner_${files.banner_id}`
        : `banner_${index}`;

      if (files.desktop_image) {
        console.log(
          `Agregando ${prefix}_desktop_image:`,
          files.desktop_image.name
        );
        formData.append(
          `${prefix}_desktop_image`,
          files.desktop_image,
          files.desktop_image.name
        );
      }
      if (files.mobile_image) {
        console.log(
          `Agregando ${prefix}_mobile_image:`,
          files.mobile_image.name
        );
        formData.append(
          `${prefix}_mobile_image`,
          files.mobile_image,
          files.mobile_image.name
        );
      }
      if (files.desktop_video) {
        formData.append(
          `${prefix}_desktop_video`,
          files.desktop_video,
          files.desktop_video.name
        );
      }
      if (files.mobile_video) {
        formData.append(
          `${prefix}_mobile_video`,
          files.mobile_video,
          files.mobile_video.name
        );
      }

      // Agregar URLs existentes si las hay (solo para banners existentes)
      if (files.banner_id) {
        if (files.desktop_image_url) {
          formData.append(
            `${prefix}_desktop_image_url`,
            files.desktop_image_url
          );
        }
        if (files.mobile_image_url) {
          formData.append(`${prefix}_mobile_image_url`, files.mobile_image_url);
        }
        if (files.desktop_video_url) {
          formData.append(
            `${prefix}_desktop_video_url`,
            files.desktop_video_url
          );
        }
        if (files.mobile_video_url) {
          formData.append(`${prefix}_mobile_video_url`, files.mobile_video_url);
        }
      }
    });

    // Usar apiClientFormData directamente (función raw de fetch)
    return apiClientFormData("/api/multimedia/pages/complete", {
      method: "POST",
      body: formData,
    }).then(async (response) => {
      console.log("Response status:", response.status, response.statusText);

      // Considerar éxito: 200, 201, 204
      if (response.ok) {
        // Si es 204 No Content, retornar éxito sin parsear body
        if (response.status === 204) {
          return {
            success: true,
            data: {
              page: {} as Page,
              created_banner_ids: [],
              created_faq_ids: [],
            },
            message: "Página creada exitosamente",
          } as CreateCompletePageResponse;
        }

        // Intentar parsear JSON
        try {
          const data = await response.json();
          console.log("Response data:", data);

          // Si no tiene success pero tiene data, asumir éxito
          if (!data.success && data.data) {
            data.success = true;
          }

          // Si la respuesta es directamente un objeto página (tiene id y slug)
          // Transformar a estructura esperada
          if (!data.success && data.id && data.slug) {
            return {
              success: true,
              data: {
                page: data as Page,
                created_banner_ids: [],
                created_faq_ids: [],
              },
              message: "Página creada exitosamente",
            } as CreateCompletePageResponse;
          }

          return data as CreateCompletePageResponse;
        } catch (e) {
          console.warn("Response OK pero no es JSON válido");
          // Si la respuesta es OK pero no es JSON, asumir éxito
          return {
            success: true,
            data: {
              page: {} as Page,
              created_banner_ids: [],
              created_faq_ids: [],
            },
            message: "Página creada exitosamente",
          } as CreateCompletePageResponse;
        }
      }

      // Si response.ok es false, es un error
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error("Backend error details:", errorData);
      } catch (e) {
        console.error("Could not parse error response");
      }
      throw new Error(errorMessage);
    });
  },

  // Actualizar página completa
  update: (id: string, data: Partial<Page>) =>
    apiClient.put<{ success: boolean; data: Page }>(
      `/api/multimedia/pages/${id}`,
      data
    ),

  // Actualizar campos específicos
  patch: (id: string, data: Partial<Page>) =>
    apiClient.patch<{ success: boolean; data: Page }>(
      `/api/multimedia/pages/${id}`,
      data
    ),

  // Eliminar página
  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(
      `/api/multimedia/pages/${id}`
    ),

  // Obtener páginas públicas activas
  getPublic: (params: { page: number; limit: number }) => {
    const searchParams = new URLSearchParams();
    searchParams.append("page", String(params.page));
    searchParams.append("limit", String(params.limit));
    const url = `/api/multimedia/pages/public?${searchParams.toString()}`;
    return apiClient.get<PagePaginationData>(url);
  },

  // Obtener estadísticas
  getStats: () =>
    apiClient.get<{
      total: number;
      by_status: Record<string, number>;
      total_views: number;
      most_viewed: Page[];
    }>("/api/multimedia/pages/stats"),
};

// Product Cards API endpoints
export const productCardEndpoints = {
  // Obtener todas las product cards
  getAll: () => apiClient.get<ProductCard[]>("/api/multimedia/product-cards"),

  // Obtener una product card por ID
  getById: (id: string) =>
    apiClient.get<ProductCard>(`/api/multimedia/product-cards/${id}`),

  // Obtener product cards por IDs
  getByIds: (ids: string[]) => {
    const idsParam = ids.join(",");
    return apiClient.get<ProductCard[]>(
      `/api/multimedia/product-cards/by-ids?ids=${idsParam}`
    );
  },

  // Obtener product cards de una página específica
  getByPageId: (pageId: string) =>
    apiClient.get<ProductCard[]>(
      `/api/multimedia/product-cards/by-page/${pageId}`
    ),

  // Crear product card con imagen
  create: (formData: FormData) =>
    apiClient.postFormData<ProductCard>(
      "/api/multimedia/product-cards",
      formData
    ),

  // Actualizar product card (con o sin imagen)
  update: (id: string, formData: FormData) =>
    apiClient.putFormData<ProductCard>(
      `/api/multimedia/product-cards/${id}`,
      formData
    ),

  // Actualizar solo datos (sin imagen)
  updateData: (id: string, data: UpdateProductCardDto) =>
    apiClient.put<ProductCard>(`/api/multimedia/product-cards/${id}`, data),

  // Eliminar product card
  delete: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(
      `/api/multimedia/product-cards/${id}`
    ),
};

// Campaign API endpoints
export interface InWebCampaignRequest {
  campaign: {
    name: string;
    type: string;
  };
  content: {
    type: "image" | "html";
    url: string;
    previewUrl: string;
    htmlContent: string;
  };
  behavior: {
    displayStyle: string;
    ttl: number;
    urgency: string;
  };
  scheduling: {
    sendImmediately: boolean;
    initialDate?: string;
    finalDate?: string;
  };
}

// Tipos para campañas InWeb
export interface InWebCampaignResponse {
  id: string;
  campaign_name: string;
  campaign_type: string;
  channel: string;
  audience: string;
  cities: string[];
  age_min: number;
  age_max: number;
  purchase_filter_operator: string;
  purchase_filter_count: number | null;
  content_type: string;
  image_url: string | null;
  content_url: string;
  html_content: string | null;
  preview_url: string;
  display_style: string;
  ttl: number;
  urgency: string;
  enable_fallback: boolean;
  enable_frequency_cap: boolean;
  max_per_day: number;
  max_per_week: number;
  send_immediately: boolean;
  initial_date: string | null;
  final_date: string | null;
  enable_ab_test: boolean;
  ab_test_percentage: number | null;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_by: string;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
}

export interface InWebCampaignsListResponse {
  data: InWebCampaignResponse[];
  total: number;
  page: number;
  limit: number;
}

// Request interface para actualizar campaña InWeb
export interface InWebCampaignUpdateRequest {
  campaign?: {
    name?: string;
    type?: string;
  };
  targeting?: {
    audience?: string;
    cities?: string[];
    ageRange?: {
      min?: number;
      max?: number;
    };
    purchaseFilter?: {
      operator?: string;
      count?: number;
    };
  };
  content?: {
    type?: "image" | "html";
    image?: string; // URL de imagen
    url?: string;
    previewUrl?: string;
    htmlContent?: string;
  };
  behavior?: {
    displayStyle?: string;
    urgency?: string;
    ttl?: number;
    enableFallback?: boolean;
  };
  scheduling?: {
    sendImmediately?: boolean;
    initialDate?: string;
    finalDate?: string;
  };
  enableFrequencyCap?: boolean;
  frequencyCap?: {
    maxPerDay?: number;
    maxPerWeek?: number;
  };
  enableABTest?: boolean;
  abTest?: {
    enabled?: boolean;
    percentage?: number;
  };
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export const campaignEndpoints = {
  // Crear campaña InWeb (con FormData para soportar upload de imágenes)
  createInWeb: (formData: FormData) =>
    apiClient.postFormData<{ success: boolean; data?: any; message?: string }>(
      "/api/campaigns/inweb-campaigns/create",
      formData
    ),
  
  // Obtener campañas InWeb
  getInWebCampaigns: (params?: { page?: number; limit?: number; status?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    
    const queryString = searchParams.toString();
    const endpoint = `/api/campaigns/inweb-campaigns${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<InWebCampaignsListResponse>(endpoint);
  },
  
  // Eliminar campaña InWeb
  deleteInWebCampaign: (id: string) => {
    return apiClient.delete<{ success: boolean; message?: string }>(
      `/api/campaigns/inweb-campaigns/${id}`
    );
  },
  
  // Pausar/Activar campaña InWeb
  updateInWebCampaignStatus: (id: string, status: 'draft' | 'active' | 'paused' | 'completed') => {
    return apiClient.patch<InWebCampaignResponse>(
      `/api/campaigns/inweb-campaigns/${id}`,
      { status }
    );
  },
  
  // Obtener una campaña InWeb individual por ID
  getInWebCampaign: (id: string) => {
    return apiClient.get<InWebCampaignResponse>(
      `/api/campaigns/inweb-campaigns/${id}`
    );
  },
  
  // Actualizar campaña InWeb (PATCH con JSON)
  updateInWebCampaign: (id: string, data: InWebCampaignUpdateRequest) => {
    return apiClient.patch<InWebCampaignResponse>(
      `/api/campaigns/inweb-campaigns/${id}`,
      data
    );
  },
  
  // Duplicar campaña InWeb
  duplicateInWebCampaign: (id: string) => {
    return apiClient.post<{ success: boolean; data?: InWebCampaignResponse; message?: string }>(
      `/api/campaigns/inweb-campaigns/${id}/duplicate`,
      {}
    );
  },
};

