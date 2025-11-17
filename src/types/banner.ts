// Posición basada en porcentajes de imagen
export interface BannerPosition {
  x: number;  // 0-100 (% del ancho de la imagen)
  y: number;  // 0-100 (% del alto de la imagen)
  imageWidth?: number;   // Metadata opcional para validación
  imageHeight?: number;  // Metadata opcional para validación
}

// Estilos de texto personalizables
export interface BannerTextStyles {
  title: {
    fontSize: string;      // Ej: "1.25rem" o "clamp(0.9rem, 1.6vw, 1.25rem)"
    fontWeight: string;    // Ej: "700", "bold"
    lineHeight: string;    // Ej: "1.2"
  };
  description: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
  cta: {
    fontSize: string;
    fontWeight: string;
    padding: string;       // Ej: "8px 14px"
    borderWidth: string;   // Ej: "1.2px"
  };
}

// Backend Banner Interface (API Response)
export interface BackendBanner {
  id: string;
  name: string;
  placement: string;
  desktop_image_url?: string;
  desktop_video_url?: string;
  mobile_image_url?: string;
  mobile_video_url?: string;
  link_url?: string;
  status: 'draft' | 'active' | 'inactive';
  title?: string;
  description?: string;
  cta?: string;
  color_font?: string;

  // NUEVO: Sistema de posicionamiento basado en porcentajes de imagen
  position_desktop?: BannerPosition;
  position_mobile?: BannerPosition;

  // NUEVO: Estilos de texto personalizables (se escala automáticamente)
  text_styles?: BannerTextStyles | string; // Puede venir como JSON string del backend

  // DEPRECADO: Mantener para compatibilidad hacia atrás con banners existentes
  coordinates?: string;
  coordinates_mobile?: string;

  category_id?: string;
  subcategory_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Pagination Response
export interface BannerPaginationData {
  data: BackendBanner[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BannerApiResponse {
  data: BannerPaginationData;
  success: boolean;
  message?: string;
}