/**
 * Tipos específicos para Landing Pages dinámicas
 * Extiende los tipos base de Page del sistema
 */

import type { Page, PageStatus } from "./page"

/**
 * Metadata de paginación para respuestas del API
 */
export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Respuesta paginada de páginas desde el API
 */
export interface PagesPaginationResponse {
  data: Page[]
  meta: PaginationMeta
}

/**
 * Estado de paginación en el cliente
 */
export interface PaginationState {
  currentPage: number
  pageSize: number
  totalPages: number
  total: number
}

/**
 * Opciones para el tamaño de página
 */
export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const
export const DEFAULT_PAGE_SIZE = 10

/**
 * Labels en español para los estados de página
 */
export const PAGE_STATUS_LABELS: Record<PageStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  scheduled: "Programado",
  archived: "Archivado",
}

/**
 * Colores para los badges de estado
 */
export const PAGE_STATUS_COLORS: Record<
  PageStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  published: "default",
  scheduled: "outline",
  archived: "destructive",
}
