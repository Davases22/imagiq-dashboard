// ============================================
// API CLIENT PARA ZONAS DE COBERTURA
// Basado en la documentación del backend
// ============================================

import { getApiKey } from "@/lib/api-client";

// ============================================
// Configuration
// ============================================

// Usar la misma configuración que el resto de la aplicación
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
// Asegurar que la URL tenga /api si no lo tiene
const baseUrl = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;
const BASE_ENDPOINT = `${baseUrl}/addresses/zonas-cobertura`;

// ============================================
// Types según documentación del backend
// ============================================

export interface Coordenada {
  lat: number;
  lon: number;
}

export enum TipoGeometria {
  POLYGON = "polygon",
  CIRCLE = "circle",
  RECTANGLE = "rectangle",
}

export enum EstadoZona {
  ACTIVA = "activa",
  INACTIVA = "inactiva",
}

export interface CreateZonaCoberturaDto {
  nombre: string;
  ciudad: string;
  tipo: TipoGeometria;
  coordenadas: Coordenada[];
  estado?: EstadoZona;
}

export interface UpdateZonaCoberturaDto {
  nombre?: string;
  tipo?: TipoGeometria;
  coordenadas?: Coordenada[];
  estado?: EstadoZona;
}

export interface ZonaCobertura {
  id: string;
  nombre: string;
  ciudad: string;
  tipo: TipoGeometria;
  estado: EstadoZona;
  creado_en: string;
  actualizado_en: string;
  geometria: {
    type: string;
    coordinates: number[][][];
  };
}

export interface VerificarCoberturaDto {
  lat: number;
  lon: number;
  ciudad?: string;
}

export interface ResultadoCobertura {
  en_cobertura: boolean;
  zona?: {
    id: string;
    nombre: string;
    ciudad: string;
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    id: string;
    properties: {
      id: string;
      nombre: string;
      ciudad: string;
      tipo: string;
      estado: string;
    };
    geometry: {
      type: string;
      coordinates: number[][][];
    };
  }>;
}

// ============================================
// HTTP Client Helper
// ============================================

export class APIError extends Error {
  constructor(message: string, public status: number, public details?: any) {
    super(message);
    this.name = "APIError";
  }
}

async function fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const apiKey = getApiKey();
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { "X-API-Key": apiKey }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Cerrar sesión en caso de 401
      if (response.status === 401) {
        if (
          typeof globalThis !== "undefined" &&
          typeof localStorage !== "undefined"
        ) {
          localStorage.removeItem("imagiq_user");
          localStorage.removeItem("imagiq_token");
          globalThis.location.href = "/login";
        }
      }

      const error = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new APIError(
        error.message || `HTTP ${response.status}`,
        response.status,
        error
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) throw error;

    throw new APIError(
      error instanceof Error ? error.message : "Network error",
      0,
      error
    );
  }
}

// ============================================
// Coverage Zones API Service
// ============================================

export const coverageZonesAPI = {
  /**
   * POST /addresses/zonas-cobertura
   * Crea una nueva zona de cobertura
   */
  async createZona(data: CreateZonaCoberturaDto): Promise<ZonaCobertura> {
    return await fetchAPI<ZonaCobertura>(BASE_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * GET /addresses/zonas-cobertura?ciudad={ciudad}
   * Obtiene todas las zonas, opcionalmente filtradas por ciudad
   */
  async getZonas(ciudad?: string): Promise<ZonaCobertura[]> {
    const url = ciudad
      ? `${BASE_ENDPOINT}?ciudad=${encodeURIComponent(ciudad)}`
      : BASE_ENDPOINT;

    return await fetchAPI<ZonaCobertura[]>(url);
  },

  /**
   * GET /addresses/zonas-cobertura/:zonaId
   * Obtiene una zona específica por ID
   */
  async getZonaById(zonaId: string): Promise<ZonaCobertura> {
    return await fetchAPI<ZonaCobertura>(`${BASE_ENDPOINT}/${zonaId}`);
  },

  /**
   * PUT /addresses/zonas-cobertura/:zonaId
   * Actualiza una zona de cobertura
   */
  async updateZona(
    zonaId: string,
    data: UpdateZonaCoberturaDto
  ): Promise<ZonaCobertura> {
    return await fetchAPI<ZonaCobertura>(`${BASE_ENDPOINT}/${zonaId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE /addresses/zonas-cobertura/:zonaId
   * Elimina una zona de cobertura
   */
  async deleteZona(zonaId: string): Promise<{ message: string }> {
    return await fetchAPI<{ message: string }>(`${BASE_ENDPOINT}/${zonaId}`, {
      method: "DELETE",
    });
  },

  /**
   * POST /addresses/zonas-cobertura/verificar
   * Verifica si un punto está en cobertura
   */
  async verificarCobertura(
    data: VerificarCoberturaDto
  ): Promise<ResultadoCobertura> {
    return await fetchAPI<ResultadoCobertura>(`${BASE_ENDPOINT}/verificar`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * GET /addresses/zonas-cobertura/ciudad/:ciudad/geojson
   * Obtiene zonas de una ciudad en formato GeoJSON
   */
  async getZonasCiudadGeoJSON(
    ciudad: string
  ): Promise<GeoJSONFeatureCollection> {
    return await fetchAPI<GeoJSONFeatureCollection>(
      `${BASE_ENDPOINT}/ciudad/${encodeURIComponent(ciudad)}/geojson`
    );
  },
};
