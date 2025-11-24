/**
 * Utilidades para parsear y construir strings de placement de banners
 *
 * Formato de placement:
 * - Placements fijos: "hero", "home-2", "notification", etc.
 * - Placements de categoría: "banner-{categoria}"
 * - Placements de subcategoría: "banner-{categoria}-{subcategoria}"
 * - Placements de submenú: "banner-{categoria}-{subcategoria}-{submenu}"
 */

export interface ParsedPlacement {
  categoryName: string;
  subcategoryName: string;
  submenuName: string;
}

const NONE_VALUE = "none";
const BANNER_PREFIX = "banner-";

/**
 * Parsea un string de placement y extrae categoría, subcategoría y submenú
 *
 * @param placement - String de placement a parsear
 * @returns Objeto con nombres de categoría, subcategoría y submenú
 *
 * @example
 * parsePlacementString("banner-Dispositivos móviles-Smartphones-Galaxy Z")
 * // Returns: { categoryName: "Dispositivos móviles", subcategoryName: "Smartphones", submenuName: "Galaxy Z" }
 */
export function parsePlacementString(placement?: string): ParsedPlacement {
  const defaultResult: ParsedPlacement = {
    categoryName: "",
    subcategoryName: NONE_VALUE,
    submenuName: NONE_VALUE,
  };

  if (!placement || !placement.startsWith(BANNER_PREFIX)) {
    return defaultResult;
  }

  const withoutPrefix = placement.replace(BANNER_PREFIX, "");
  const parts = withoutPrefix.split("-");

  if (parts.length === 0) {
    return defaultResult;
  }

  return {
    categoryName: parts[0] || "",
    subcategoryName: parts[1] || NONE_VALUE,
    submenuName: parts.length > 2 ? parts.slice(2).join("-") : NONE_VALUE,
  };
}

/**
 * Construye un string de placement basado en categoría, subcategoría y submenú
 *
 * @param categoryName - Nombre de la categoría
 * @param subcategoryName - Nombre de la subcategoría (opcional)
 * @param submenuName - Nombre del submenú (opcional)
 * @returns String de placement construido
 *
 * @example
 * buildPlacementString("Dispositivos móviles", "Smartphones", "Galaxy Z")
 * // Returns: "banner-Dispositivos móviles-Smartphones-Galaxy Z"
 */
export function buildPlacementString(
  categoryName: string,
  subcategoryName?: string,
  submenuName?: string
): string {
  if (!categoryName) {
    return "";
  }

  const parts = [BANNER_PREFIX + categoryName];

  const hasSubcategory = subcategoryName && subcategoryName !== NONE_VALUE;
  const hasSubmenu = submenuName && submenuName !== NONE_VALUE;

  if (hasSubcategory) {
    parts.push(subcategoryName);

    if (hasSubmenu) {
      parts.push(submenuName);
    }
  }

  return parts.join("-");
}

/**
 * Verifica si un placement es de tipo categoría (banner-xxx)
 */
export function isCategoryPlacement(placement: string): boolean {
  return placement.startsWith(BANNER_PREFIX);
}

/**
 * Verifica si un placement requiere selección de categoría
 */
export function requiresCategorySelection(placement: string): boolean {
  return placement === "category-top" || isCategoryPlacement(placement);
}
