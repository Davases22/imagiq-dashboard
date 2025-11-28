/**
 * Tipos para el sistema de páginas (ofertas, promociones, etc.)
 */

import type { BackendBanner } from "./banner";
import type { ProductCard } from "./product-card";

// Estado de la página
export type PageStatus = "draft" | "published" | "scheduled" | "archived";

// Sección de productos (frontend)
export interface ProductSection {
  id: string;
  name: string;
  products: string[];
}

// Sección de productos (backend DTO)
export interface ProductSectionDTO {
  id: string;
  name: string;
  order: number;
  product_ids?: string[]; // Deprecated: usar product_card_ids
  product_card_ids: string[]; // IDs de product cards personalizados
}

// Sección informativa
export interface InfoSection {
  id: string;
  title: string;
  content: string; // HTML/Markdown
  order: number;
  background_color?: string;
  text_color?: string;
}

// FAQ
export interface PageFAQ {
  pregunta: string;
  respuesta: string;
  activo: boolean;
  categoria?: string;
  prioridad?: number;
}

// Banner nuevo a crear
export interface NewBanner {
  name: string;
  placement: string;
  status: "draft" | "active";
  title?: string;
  description?: string;
  cta?: string;
  color_font?: string;
  link_url?: string;
  coordinates?: string;
  coordinates_mobile?: string;
  position_desktop?: {
    x: number;
    y: number;
    imageWidth?: number;
    imageHeight?: number;
  };
  position_mobile?: {
    x: number;
    y: number;
    imageWidth?: number;
    imageHeight?: number;
  };
}

// Actualización de banner existente
export interface BannerUpdate {
  id: string;
  position_desktop?: {
    x: number;
    y: number;
    imageWidth?: number;
    imageHeight?: number;
  };
  position_mobile?: {
    x: number;
    y: number;
    imageWidth?: number;
    imageHeight?: number;
  };
  // Campos opcionales que también pueden actualizarse
  title?: string;
  description?: string;
  cta?: string;
  color_font?: string;
  link_url?: string;
  coordinates?: string;
  coordinates_mobile?: string;
}

// Archivos de banner
export interface BannerFiles {
  desktop_image?: File;
  mobile_image?: File;
  desktop_video?: File;
  mobile_video?: File;
}

// Página (backend response)
export interface Page {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  valid_from?: string;
  valid_until?: string;
  banner_ids: string[];
  faq_ids: string[];
  sections: ProductSectionDTO[];
  products_section_title?: string;
  products_section_description?: string;
  info_sections?: InfoSection[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  category?: string;
  subcategory?: string;
  tags?: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_public: boolean;
  is_active: boolean;
}

// Página expandida con relaciones
export interface PageExpanded extends Page {
  banners?: BackendBanner[];
  faqs?: FAQ[];
  product_cards?: ProductCard[];
}

// FAQ completo (desde BD)
export interface FAQ {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria?: string;
  subcategoria?: string;
  palabras_clave?: string[];
  activo: boolean;
  prioridad: number;
  created_at: string;
  updated_at: string;
}

// Request para crear página completa
export interface CreateCompletePageRequest {
  page: {
    id?: string; // ID de la página (solo en modo edición)
    slug: string;
    title: string;
    status?: PageStatus;
    valid_from?: string;
    valid_until?: string;
    created_by: string; // Email del usuario que crea la página
    sections: ProductSectionDTO[];
    products_section_title?: string;
    products_section_description?: string;
    info_sections?: InfoSection[];
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    category?: string;
    subcategory?: string;
    tags?: string;
    is_public?: boolean;
    is_active?: boolean;
  };
  new_banners: NewBanner[];
  existing_banner_ids: string[];
  banner_updates?: BannerUpdate[]; // Actualizaciones de banners existentes (ej: posiciones drag & drop)
  new_faqs: PageFAQ[];
  existing_faq_ids: string[];
  banner_files: BannerFiles[]; // Array de archivos por banner
}

// Response de creación completa
export interface CreateCompletePageResponse {
  success: boolean;
  data: {
    page: Page;
    created_banner_ids: string[];
    created_faq_ids: string[];
  };
  message: string;
  error?: string;
}

// Paginación
export interface PagePaginationData {
  data: Page[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
