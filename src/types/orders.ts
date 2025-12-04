/**
 * Tipos para el endpoint GET /admin/orders
 * y GET /admin/orders/metrics
 * Documentación: ORDENES_README.md
 */

// Estados de orden posibles
export type ApiOrderStatus =
  | "PENDING"
  | "APPROVED"
  | "CANCELLED"
  | "REJECTED"
  | "ABANDONED"
  | "INTERNAL_ERROR";

// Medios de pago
export type ApiPaymentMethod = "Tarjeta" | "PSE" | "Addi";

// Campos permitidos para ordenamiento
export type OrderSortField =
  | "serial_id"
  | "total_amount"
  | "estado"
  | "cliente"
  | "medio_pago"
  | "numero_documento"
  | "fecha_creacion";

// Dirección del ordenamiento
export type SortOrder = "asc" | "desc";

/**
 * Orden devuelta por la API
 */
export interface ApiOrder {
  serial_id: number;
  cliente: string;
  numero_documento: string;
  total_amount: number;
  estado: ApiOrderStatus;
  medio_pago: ApiPaymentMethod;
  info_pago: string;
  fecha_creacion: string;
}

/**
 * Información de paginación
 */
export interface OrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Respuesta del endpoint GET /admin/orders
 */
export interface OrdersApiResponse {
  data: ApiOrder[];
  pagination: OrdersPagination;
}

/**
 * Parámetros de consulta para el endpoint
 */
export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  sortField?: OrderSortField;
  sortOrder?: SortOrder;
  search?: string;
}

/**
 * Helper para obtener el label del estado
 */
export const getApiOrderStatusLabel = (status: ApiOrderStatus): string => {
  const labels: Record<ApiOrderStatus, string> = {
    PENDING: "Pendiente",
    APPROVED: "Aprobada",
    CANCELLED: "Cancelada",
    REJECTED: "Rechazada",
    ABANDONED: "Abandonada",
    INTERNAL_ERROR: "Error Interno",
  };
  return labels[status] || status;
};

/**
 * Helper para obtener el color del badge según el estado
 * Retorna "outline" para usar colores personalizados
 */
export const getApiOrderStatusVariant = (
  status: ApiOrderStatus
): "default" | "secondary" | "destructive" | "outline" => {
  // Usamos outline para todos y aplicamos colores personalizados
  return "outline";
};

/**
 * Helper para obtener las clases de estilo del badge según el estado
 * Incluye colores de fondo, texto y borde para mejor visibilidad
 */
export const getApiOrderStatusColor = (status: ApiOrderStatus): string => {
  const colors: Record<ApiOrderStatus, string> = {
    PENDING:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
    APPROVED:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
    CANCELLED:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-600",
    REJECTED:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
    ABANDONED:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-600",
    INTERNAL_ERROR:
      "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700 border-gray-300";
};

// ============================================
// Tipos para GET /admin/orders/metrics
// ============================================

/**
 * Métricas generales de órdenes
 */
export interface OrderMetrics {
  total_ordenes: number;
  total_ingresos: number;
  promedio_ingreso: number;
  tasa_entrega_porcentaje: number;
  total_recoger_en_tienda: number;
  total_pendientes: number;
  total_aprobadas: number;
  total_en_reparto: number;
  total_entregadas: number;
  total_canceladas: number;
}

/**
 * Distribución de órdenes por estado
 */
export interface StatusDistribution {
  cantidad: number;
  estado: string;
}

/**
 * Respuesta del endpoint GET /admin/orders/metrics
 */
export interface OrdersMetricsResponse {
  metrics: OrderMetrics;
  statusDistribution: StatusDistribution[];
}
