// Posición basada en porcentajes de imagen
export interface BannerPosition {
  x: number;  // 0-100 (% del ancho de la imagen)
  y: number;  // 0-100 (% del alto de la imagen)
  imageWidth?: number;   // Metadata opcional para validación
  imageHeight?: number;  // Metadata opcional para validación
}

// Caja de contenido individual (título o descripción)
export interface ContentBox {
  id: string;
  text: string;
  position_desktop: { x: number; y: number };
  position_mobile: { x: number; y: number };
  styles?: {
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string;
    textShadow?: string;
    maxWidth?: string;
    whiteSpace?: 'normal' | 'pre-line' | 'pre-wrap';
  };
}

// Caja de CTA (Call To Action)
export interface CTABox {
  id: string;
  text: string;
  link_url?: string;
  position_desktop: { x: number; y: number };
  position_mobile: { x: number; y: number };
  styles?: {
    fontSize?: string;
    fontWeight?: string;
    backgroundColor?: string;
    color?: string;
    padding?: string;
    borderRadius?: string;
    borderWidth?: string;
    borderColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string;
    boxShadow?: string;
    transition?: string;
  };
}

// NUEVO SISTEMA: Bloques de contenido agrupado
// Soporta configuraciones independientes para desktop y mobile
export interface ContentBlock {
  id: string;
  position_desktop: { x: number; y: number };
  position_mobile: { x: number; y: number };
  
  // Alineación del bloque completo (desktop)
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: string;
  gap?: string; // Espacio entre elementos del bloque
  
  // Configuraciones mobile del contenedor (opcional, fallback a desktop)
  textAlign_mobile?: 'left' | 'center' | 'right' | 'justify';
  maxWidth_mobile?: string;
  gap_mobile?: string;
  
  // Elementos opcionales dentro del bloque
  title?: {
    text: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    lineHeight?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string;
    textShadow?: string;
  };
  
  // Configuración mobile del título (opcional, fallback a desktop)
  title_mobile?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    lineHeight?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string;
    textShadow?: string;
  };
  
  subtitle?: {
    text: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    lineHeight?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string;
    textShadow?: string;
  };
  
  // Configuración mobile del subtítulo (opcional)
  subtitle_mobile?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    lineHeight?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string;
    textShadow?: string;
  };
  
  description?: {
    text: string;
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    lineHeight?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string;
    textShadow?: string;
  };
  
  // Configuración mobile de la descripción (opcional)
  description_mobile?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    lineHeight?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: string;
    textShadow?: string;
  };
  
  cta?: {
    text: string;
    link_url?: string;
    fontSize?: string;
    fontWeight?: string;
    backgroundColor?: string;
    color?: string;
    padding?: string;
    borderRadius?: string;
    border?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  };
  
  // Configuración mobile del CTA (opcional)
  cta_mobile?: {
    fontSize?: string;
    fontWeight?: string;
    backgroundColor?: string;
    color?: string;
    padding?: string;
    borderRadius?: string;
    border?: string;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  };
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

  // NUEVO SISTEMA: Bloques de contenido JSON
  content_blocks?: string | ContentBlock[];  // JSON string o array parseado

  category_id?: string;
  subcategory_id?: string;
  submenu_id?: string;
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