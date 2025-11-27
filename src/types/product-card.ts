// Tipos para Product Cards en Landing Pages

// Posicionamiento de contenido (mismo patrón que banners)
export interface ProductCardPosition {
  x: string // "10%" - porcentaje del ancho
  y: string // "20%" - porcentaje del alto
}

export interface ProductCardContentPosition {
  title?: ProductCardPosition
  subtitle?: ProductCardPosition
  description?: ProductCardPosition
  cta?: ProductCardPosition
}

// Estilos de texto
export interface ProductCardTextStyles {
  title?: Record<string, string>
  subtitle?: Record<string, string>
  description?: Record<string, string>
  cta?: Record<string, string>
}

// Estado de la product card
export type ProductCardStatus = 'active' | 'inactive' | 'draft'

// Product Card (respuesta del backend)
export interface ProductCard {
  id: string
  page_id: string | null
  image_url: string
  title: string
  subtitle: string | null
  description: string | null
  cta_text: string | null
  cta_url: string | null
  url: string | null
  content_position: ProductCardContentPosition | null
  text_styles: ProductCardTextStyles | null
  status: ProductCardStatus
  created_at: string
  updated_at: string
  created_by: string | null
}

// DTO para crear product card
export interface CreateProductCardDto {
  page_id?: string
  title: string
  subtitle?: string
  description?: string
  cta_text?: string
  cta_url?: string
  url?: string
  content_position?: ProductCardContentPosition
  text_styles?: ProductCardTextStyles
  status?: ProductCardStatus
  created_by?: string
}

// DTO para actualizar product card
export interface UpdateProductCardDto {
  page_id?: string
  image_url?: string
  title?: string
  subtitle?: string
  description?: string
  cta_text?: string
  cta_url?: string
  url?: string
  content_position?: ProductCardContentPosition
  text_styles?: ProductCardTextStyles
  status?: ProductCardStatus
}

// Respuesta de la API
export interface ProductCardApiResponse {
  data: ProductCard
  success: boolean
  message?: string
}

export interface ProductCardsApiResponse {
  data: ProductCard[]
  success: boolean
  message?: string
}

// Paginación (por si se necesita en el futuro)
export interface ProductCardPaginationData {
  data: ProductCard[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ProductCardPaginationResponse {
  data: ProductCardPaginationData
  success: boolean
  message?: string
}
