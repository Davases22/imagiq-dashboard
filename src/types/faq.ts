/**
 * Tipos TypeScript para FAQs
 */

export interface Faq {
  id: string;
  pregunta: string;
  respuesta: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFaqDto {
  pregunta: string;
  respuesta: string;
  activo?: boolean;
}

export interface UpdateFaqDto {
  id: string;
  pregunta?: string;
  respuesta?: string;
  activo?: boolean;
}

export interface FaqPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FaqPaginationData {
  data: Faq[];
  meta: FaqPaginationMeta;
}

export interface FaqStatsResponse {
  total: number;
  activos: number;
  inactivos: number;
  sinRespuesta: number; // Cantidad de FAQs con respuesta "sin respuesta"
}
