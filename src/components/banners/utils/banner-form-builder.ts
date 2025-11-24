/**
 * Utilidades para construir FormData de banners
 * Centraliza la lógica de construcción de formularios para crear y editar banners
 */

import type { BannerPosition, BannerTextStyles } from "@/types/banner";

export interface BannerFormFields {
  name: string;
  placement: string;
  link_url: string;
  title: string;
  description: string;
  cta: string;
  color_font: string;
  coordinates: string;
  coordinates_mobile: string;
  category_id?: string;
  subcategory_id?: string;
  submenu_id?: string;
  // NUEVO: Posiciones basadas en porcentajes
  position_desktop?: BannerPosition;
  position_mobile?: BannerPosition;
  // NUEVO: Estilos de texto
  text_styles?: BannerTextStyles;
}

export interface BannerMediaFiles {
  desktop_image?: File;
  desktop_video?: File;
  mobile_image?: File;
  mobile_video?: File;
}

export interface ExistingMediaUrls {
  desktop_image_url?: string;
  desktop_video_url?: string;
  mobile_image_url?: string;
  mobile_video_url?: string;
}

/**
 * Agrega los campos de texto al FormData
 */
function appendTextFields(
  formData: FormData,
  fields: BannerFormFields,
  status: "draft" | "active",
  bannerId?: string
): void {
  // Si es edición, agregar ID
  if (bannerId) {
    formData.append("id", bannerId);
  }

  // Campos requeridos
  formData.append("name", fields.name);
  formData.append("placement", fields.placement);
  formData.append("status", status);

  // Campos opcionales - Siempre se envían para permitir borrado (strings vacíos)
  formData.append("link_url", fields.link_url || "");
  formData.append("title", fields.title || "");
  formData.append("description", fields.description || "");
  formData.append("cta", fields.cta || "");
  formData.append("color_font", fields.color_font || "");
  formData.append("coordinates", fields.coordinates || "");
  formData.append("coordinates_mobile", fields.coordinates_mobile || "");

  // NUEVO: Posiciones basadas en porcentajes (como JSON)
  if (fields.position_desktop) {
    formData.append("position_desktop", JSON.stringify(fields.position_desktop));
  }
  if (fields.position_mobile) {
    formData.append("position_mobile", JSON.stringify(fields.position_mobile));
  }

  // Estilos de texto como JSON
  if (fields.text_styles) {
    formData.append('text_styles', JSON.stringify(fields.text_styles));
  }

  // NOTA: NO enviamos category_id, subcategory_id, submenu_id al backend
  // El placement string es suficiente para que el frontend determine la ubicación
  // Enviar estos UUIDs causa errores de validación 500 en el backend
  // Solo el placement es necesario: "banner-{categoria}-{menu}-{submenu}"
}

/**
 * Agrega archivos nuevos al FormData con sus keys específicas
 * Cada archivo se envía con su propia key para permitir actualizaciones independientes
 */
function appendNewFiles(formData: FormData, files: BannerMediaFiles): void {
  if (files.desktop_image) {
    formData.append("desktop_image", files.desktop_image, files.desktop_image.name);
  }

  if (files.mobile_image) {
    formData.append("mobile_image", files.mobile_image, files.mobile_image.name);
  }

  if (files.desktop_video) {
    formData.append("desktop_video", files.desktop_video, files.desktop_video.name);
  }

  if (files.mobile_video) {
    formData.append("mobile_video", files.mobile_video, files.mobile_video.name);
  }
}

/**
 * Agrega URLs de medios existentes al FormData (solo para edición)
 * Solo se agregan si NO hay un archivo nuevo para reemplazarlas
 */
function appendExistingUrls(
  formData: FormData,
  files: BannerMediaFiles,
  existingUrls: ExistingMediaUrls
): void {
  // Solo agregar URLs si no hay archivos nuevos que las reemplacen
  if (!files.desktop_image && existingUrls.desktop_image_url) {
    formData.append("desktop_image_url", existingUrls.desktop_image_url);
  }

  if (!files.mobile_image && existingUrls.mobile_image_url) {
    formData.append("mobile_image_url", existingUrls.mobile_image_url);
  }

  if (!files.desktop_video && existingUrls.desktop_video_url) {
    formData.append("desktop_video_url", existingUrls.desktop_video_url);
  }

  if (!files.mobile_video && existingUrls.mobile_video_url) {
    formData.append("mobile_video_url", existingUrls.mobile_video_url);
  }
}

/**
 * Construye el FormData completo para crear un banner
 */
export function buildCreateBannerFormData(
  fields: BannerFormFields,
  files: BannerMediaFiles,
  status: "draft" | "active"
): FormData {
  const formData = new FormData();
  appendTextFields(formData, fields, status);
  appendNewFiles(formData, files);
  return formData;
}

/**
 * Construye el FormData completo para editar un banner
 */
export function buildUpdateBannerFormData(
  bannerId: string,
  fields: BannerFormFields,
  files: BannerMediaFiles,
  existingUrls: ExistingMediaUrls,
  status: "draft" | "active"
): FormData {
  const formData = new FormData();
  appendTextFields(formData, fields, status, bannerId);
  appendExistingUrls(formData, files, existingUrls);
  appendNewFiles(formData, files);
  return formData;
}
