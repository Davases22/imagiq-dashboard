/**
 * Tipos para el sistema de formularios en landing pages
 */

// Tipos de campo disponibles
export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "number"
  | "date"
  | "address";

// Validación de campo
export interface FormFieldValidation {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  message?: string;
}

// Definición de un campo de formulario
export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: string[]; // Para select/radio/checkbox
  validation?: FormFieldValidation;
  width: "full" | "half";
}

// Configuración del formulario
export interface FormConfig {
  fields: FormFieldDefinition[];
  submit_button_text: string;
  submit_button_style?: {
    background_color?: string;
    text_color?: string;
    border_radius?: string;
  };
}

// Tipos de layout
export type FormLayoutType =
  | "banner_top"
  | "banner_left"
  | "banner_right"
  | "banner_behind"
  | "form_only";

// Configuración de layout
export interface FormLayout {
  type: FormLayoutType;
  banner_width?: number; // % para layouts laterales (30-70)
  form_width?: number;
  form_max_width?: string; // "600px"
  background_color?: string;
  form_background_color?: string;
  banner_overlay_opacity?: number; // 0-1 para 'banner_behind'
}

// Configuración post-envío
export interface FormSuccessConfig {
  type: "message" | "redirect";
  message?: string;
  redirect_url?: string;
}

// Status de envío
export type SubmissionStatus = "nuevo" | "leido" | "procesado" | "archivado";

// Envío de formulario (respuesta del backend)
export interface FormSubmission {
  id: string;
  page_id: string;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  usuario_id?: string;
  created_at: string;
  updated_at: string;
}

// Paginación de envíos
export interface FormSubmissionsPagination {
  data: FormSubmission[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Estadísticas de envíos
export interface FormSubmissionStats {
  total: number;
  nuevo: number;
  leido: number;
  procesado: number;
  archivado: number;
  today: number;
  this_week: number;
}

// Labels para tipos de campo
export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Texto",
  email: "Correo electrónico",
  phone: "Teléfono",
  textarea: "Texto largo",
  select: "Lista desplegable",
  checkbox: "Casilla de verificación",
  radio: "Opción múltiple",
  number: "Número",
  date: "Fecha",
  address: "Dirección",
};

// Labels para layouts
export const FORM_LAYOUT_LABELS: Record<FormLayoutType, string> = {
  banner_top: "Banner arriba",
  banner_left: "Banner a la izquierda",
  banner_right: "Banner a la derecha",
  banner_behind: "Banner de fondo",
  form_only: "Solo formulario",
};

// Labels para status de envíos
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  nuevo: "Nuevo",
  leido: "Leído",
  procesado: "Procesado",
  archivado: "Archivado",
};

// Colores para status de envíos (Tailwind classes)
export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  nuevo: "bg-blue-100 text-blue-800",
  leido: "bg-yellow-100 text-yellow-800",
  procesado: "bg-green-100 text-green-800",
  archivado: "bg-gray-100 text-gray-800",
};
