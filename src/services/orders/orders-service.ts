/**
 * Servicio para gestión de órdenes
 * Endpoints:
 * - GET /admin/orders
 * - GET /admin/orders/metrics
 */

import { apiGet } from "@/lib/api-client";
import {
  OrdersApiResponse,
  OrdersQueryParams,
  OrdersMetricsResponse,
} from "@/types/orders";

/**
 * Construye los query params para la petición
 */
function buildQueryString(params: OrdersQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", params.page.toString());
  }
  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }
  if (params.sortField) {
    searchParams.set("sortField", params.sortField);
  }
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Obtiene la lista paginada de órdenes
 *
 * @param params - Parámetros de consulta (página, límite, ordenamiento, búsqueda)
 * @param token - Token JWT para autenticación
 * @returns Promise con la respuesta de órdenes y paginación
 *
 * @example
 * const { data, pagination } = await getOrders(
 *   { page: 1, limit: 20, sortField: 'fecha_creacion', sortOrder: 'desc' },
 *   'jwt-token'
 * );
 */
export async function getOrders(
  params: OrdersQueryParams = {},
  token?: string | null
): Promise<OrdersApiResponse> {
  const queryString = buildQueryString(params);
  const endpoint = `/api/admin/orders${queryString}`;

  return apiGet<OrdersApiResponse>(endpoint, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

/**
 * Obtiene las métricas generales de órdenes
 *
 * @param token - Token JWT para autenticación
 * @returns Promise con métricas y distribución de estados
 *
 * @example
 * const { metrics, statusDistribution } = await getOrdersMetrics('jwt-token');
 * console.log(metrics.total_ordenes, metrics.total_ingresos);
 */
export async function getOrdersMetrics(
  token?: string | null
): Promise<OrdersMetricsResponse> {
  return apiGet<OrdersMetricsResponse>("/api/admin/orders/metrics", {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
