/**
 * 🔧 UTILIDADES DE NORMALIZACIÓN DE TEXTO PARA BANNERS
 *
 * Asegura consistencia entre Dashboard y Frontend al construir placements.
 * Evita problemas con espacios múltiples, espacios al inicio/final, etc.
 *
 * IMPORTANTE: Esta normalización SOLO se aplica a placements que empiezan con "banner-"
 * Los placements de hero, home, notification, etc. NO se tocan.
 *
 * ⚠️ ESTE ARCHIVO DEBE SER IDÉNTICO AL DEL FRONTEND
 */

/**
 * Normaliza texto para uso en placements de banners
 *
 * Transformaciones aplicadas:
 * - Elimina espacios al inicio y final (trim)
 * - Reemplaza múltiples espacios consecutivos por un solo espacio
 * - Mantiene mayúsculas/minúsculas originales
 * - Preserva caracteres especiales (acentos, ñ, etc.)
 *
 * @param text - Texto a normalizar
 * @returns Texto normalizado
 *
 * @example
 * normalizeForPlacement("  Galaxy   Tab  S  ")
 * // Returns: "Galaxy Tab S"
 *
 * normalizeForPlacement("Dispositivos  móviles")
 * // Returns: "Dispositivos móviles"
 */
export function normalizeForPlacement(text: string): string {
  return text
    .trim()                    // Eliminar espacios al inicio/final
    .replace(/\s+/g, ' ');      // Reemplazar espacios múltiples por uno solo
}

/**
 * Construye un placement normalizado para banners de producto
 *
 * Formato: banner-{categoria}-{menu}-{submenu}
 *
 * IMPORTANTE: Solo usar para placements que empiezan con "banner-"
 * NO usar para: hero, home, home-2, home-3, notification, category-top
 *
 * @param categoria - Nombre visible de la categoría (ej: "Dispositivos móviles")
 * @param menu - Nombre visible del menú/subcategoría (opcional)
 * @param submenu - Nombre visible del submenú/serie (opcional)
 * @returns Placement normalizado
 *
 * @example
 * buildNormalizedPlacement("Dispositivos móviles", "Smartphones", "Galaxy Z")
 * // Returns: "banner-Dispositivos móviles-Smartphones-Galaxy Z"
 *
 * buildNormalizedPlacement("Dispositivos móviles", "Tablets")
 * // Returns: "banner-Dispositivos móviles-Tablets"
 *
 * buildNormalizedPlacement("Electrodomésticos")
 * // Returns: "banner-Electrodomésticos"
 */
export function buildNormalizedPlacement(
  categoria: string,
  menu?: string | null,
  submenu?: string | null
): string {
  const parts = ['banner', normalizeForPlacement(categoria)];

  if (menu && menu !== 'none') {
    parts.push(normalizeForPlacement(menu));
  }

  if (submenu && submenu !== 'none') {
    parts.push(normalizeForPlacement(submenu));
  }

  return parts.join('-');
}

/**
 * Verifica si un placement necesita normalización
 *
 * @param placement - Placement a verificar
 * @returns true si el placement debe ser normalizado (empieza con "banner-")
 *
 * @example
 * shouldNormalizePlacement("banner-Dispositivos móviles-Smartphones")
 * // Returns: true
 *
 * shouldNormalizePlacement("hero")
 * // Returns: false
 *
 * shouldNormalizePlacement("home-2")
 * // Returns: false
 */
export function shouldNormalizePlacement(placement: string): boolean {
  return placement.startsWith('banner-');
}

/**
 * Normaliza un placement existente (para migración de datos)
 *
 * Solo normaliza si el placement empieza con "banner-"
 * Mantiene intactos los otros tipos de placement
 *
 * @param placement - Placement original
 * @returns Placement normalizado (o el mismo si no requiere normalización)
 *
 * @example
 * normalizePlacement("banner-Dispositivos  móviles-Smartphones-Galaxy   Z")
 * // Returns: "banner-Dispositivos móviles-Smartphones-Galaxy Z"
 *
 * normalizePlacement("hero")
 * // Returns: "hero" (sin cambios)
 *
 * normalizePlacement("notification")
 * // Returns: "notification" (sin cambios)
 */
export function normalizePlacement(placement: string): string {
  // Si no empieza con "banner-", retornar sin cambios
  if (!shouldNormalizePlacement(placement)) {
    return placement;
  }

  // Separar por guiones
  const parts = placement.split('-');

  // El primer elemento es "banner", mantenerlo
  const normalizedParts = [parts[0]];

  // Normalizar el resto de partes
  for (let i = 1; i < parts.length; i++) {
    normalizedParts.push(normalizeForPlacement(parts[i]));
  }

  return normalizedParts.join('-');
}
