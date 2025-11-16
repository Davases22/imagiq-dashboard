/**
 * 🔐 API Client - Cliente HTTP con API Key automática
 *
 * Este módulo proporciona funciones helper para hacer peticiones HTTP al backend
 * con autenticación API Key automática.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

// Advertencia en desarrollo si no está configurada la API Key
if (!API_KEY && process.env.NODE_ENV === 'development') {
  console.warn(
    '⚠️ NEXT_PUBLIC_API_KEY no está configurada. Las peticiones al API fallarán.\n' +
    'Agrega NEXT_PUBLIC_API_KEY a tu archivo .env.local'
  );
}

/**
 * Cliente HTTP base con API Key automática
 *
 * @param endpoint - Ruta relativa del API (ej: '/api/products')
 * @param options - Opciones de fetch estándar
 * @returns Promise<Response>
 *
 * @example
 * const response = await apiClient('/api/products', { method: 'GET' });
 * const data = await response.json();
 */
export async function apiClient(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;

  // Combinar headers: API Key + headers personalizados
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY }),
    ...options.headers,
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Manejar errores específicos
    if (!response.ok) {
      if (response.status === 401) {
        const error = new Error('API Key inválida o faltante');
        console.error('🔐 Error de autenticación:', error.message);
        throw error;
      }
      if (response.status === 429) {
        const error = new Error('Demasiadas peticiones. Por favor intenta más tarde.');
        console.error('⚠️ Rate limit excedido:', error.message);
        throw error;
      }
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ API Client Error:', error.message, { endpoint, url });
    }
    throw error;
  }
}

/**
 * Cliente HTTP para FormData con API Key automática
 * (No incluye Content-Type para que el navegador lo setee con boundary correcto)
 *
 * @param endpoint - Ruta relativa del API
 * @param options - Opciones de fetch estándar
 * @returns Promise<Response>
 */
export async function apiClientFormData(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;

  // Headers sin Content-Type (para FormData)
  const headers = new Headers({
    ...(API_KEY && { 'X-API-Key': API_KEY }),
    ...options.headers,
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        const error = new Error('API Key inválida o faltante');
        console.error('🔐 Error de autenticación:', error.message);
        throw error;
      }
      if (response.status === 429) {
        const error = new Error('Demasiadas peticiones. Por favor intenta más tarde.');
        console.error('⚠️ Rate limit excedido:', error.message);
        throw error;
      }
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ API Client Error:', error.message, { endpoint, url });
    }
    throw error;
  }
}

/**
 * Helper para peticiones GET con tipado TypeScript
 *
 * @param endpoint - Ruta relativa del API
 * @returns Promise con datos parseados
 *
 * @example
 * const products = await apiGet<Product[]>('/api/products?limit=10');
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<T> {
  const response = await apiClient(endpoint, { method: 'GET' });
  return response.json();
}

/**
 * Helper para peticiones POST con tipado TypeScript
 *
 * @param endpoint - Ruta relativa del API
 * @param data - Datos a enviar en el body
 * @returns Promise con datos parseados
 *
 * @example
 * const order = await apiPost<Order>('/api/orders', { items: [...] });
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  data: unknown
): Promise<T> {
  const response = await apiClient(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Helper para peticiones PUT con tipado TypeScript
 *
 * @param endpoint - Ruta relativa del API
 * @param data - Datos a actualizar
 * @returns Promise con datos parseados
 *
 * @example
 * const updatedUser = await apiPut<User>('/api/users/123', { name: 'New Name' });
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  data: unknown
): Promise<T> {
  const response = await apiClient(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Helper para peticiones PATCH con tipado TypeScript
 *
 * @param endpoint - Ruta relativa del API
 * @param data - Datos parciales a actualizar
 * @returns Promise con datos parseados
 *
 * @example
 * const updated = await apiPatch<User>('/api/users/123', { email: 'new@email.com' });
 */
export async function apiPatch<T = unknown>(
  endpoint: string,
  data: unknown
): Promise<T> {
  const response = await apiClient(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Helper para peticiones DELETE con tipado TypeScript
 *
 * @param endpoint - Ruta relativa del API
 * @returns Promise con datos parseados (si los hay)
 *
 * @example
 * await apiDelete('/api/products/123');
 */
export async function apiDelete<T = unknown>(endpoint: string): Promise<T> {
  const response = await apiClient(endpoint, { method: 'DELETE' });

  // Algunas APIs de DELETE retornan 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Obtener URL base del API
 */
export function getApiUrl(): string {
  return API_URL;
}

/**
 * Verificar si la API Key está configurada
 */
export function isApiKeyConfigured(): boolean {
  return !!API_KEY;
}

/**
 * Obtener la API Key (para casos especiales)
 */
export function getApiKey(): string | undefined {
  return API_KEY;
}
