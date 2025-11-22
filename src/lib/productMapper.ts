/**
 * Product Mapper - Convierte datos de API a formato del frontend
 * - Mapea ProductApiData a ProductCardProps
 * - Usa imágenes mock mientras se implementan
 */

import { ProductApiData, ProductBundle, ProductGrouped } from './api';
import { StaticImageData } from 'next/image';

// Importar imágenes mock para usar temporalmente
import emptyImg from '@/img/empty.jpeg';

export interface ProductColor {
  name: string; // Nombre técnico del color (ej: "black", "white")
  hex: string; // Código hexadecimal del color (ej: "#000000")
  label: string; // Nombre mostrado al usuario (ej: "Negro Medianoche")
  sku: string; // SKU específico para esta variante
  price?: string; // Precio específico para esta variante (opcional)
  originalPrice?: string; // Precio original antes de descuento (opcional)
  discount?: string; // Descuento específico para esta variante (opcional)
  stock?: number; // Stock ecommerce disponible para esta variante (opcional)
  stockTiendas?: Record<string, number>; // Stock por tienda para esta variante (opcional)
  stockTotal?: number; // Stock total para esta variante (opcional)
  description?: string; // Descripción detallada de esta variante (opcional)
  capacity?: string; // Capacidad específica de esta variante (256GB, 512GB, 1TB, etc.)
  ram?: string; // Memoria RAM específica de esta variante (12GB, 16GB, etc.)
  imageUrl?: string; // URL de la imagen específica de esta variante (opcional)
  imageDetailsUrls?: string[]; // URLs de las imágenes detalladas de esta variante (opcional)
  // ✅ NUEVA ARQUITECTURA SIMPLIFICADA
  premiumImages?: string[]; // URLs de las imágenes del CARRUSEL premium (sin marcadores especiales)
  devicePremiumImage?: string | null; // URL de la imagen premium del DISPOSITIVO (puede ser null)
  premiumVideos?: string[]; // URLs de los videos premium del carrusel
}


export interface ProductCardProps {
  id: string;
  name: string;
  image: string | StaticImageData;
  colors: ProductColor[];
  rating?: number;
  reviewCount?: number;
  price?: string;
  originalPrice?: string;
  discount?: string;
  isNew?: boolean;
  isFavorite?: boolean;
  onAddToCart?: (productId: string, color: string) => void;
  onToggleFavorite?: (productId: string) => void;
  className?: string;
  // Datos adicionales para la página de detalle
  description?: string | null;
  brand?: string;
  model?: string;
  category?: string;
  menu?: string;
  capacity?: string | null;
  stock?: number;
  stockTotal?: number;
  sku?: string | null;
  detailedDescription?: string | null;
  selectedColor?: ProductColor;
  setSelectedColor?: (color: ProductColor) => void;
  puntos_q?: number; // Puntos Q acumulables por producto (valor fijo por ahora)
  segmento?: string[]; // Array de segmentos del producto (ej: ["Premium"])
  // Campos para bundles
  isBundle?: boolean;
  bundlePrice?: number;
  bundleDiscount?: number;
  skusBundle?: string[];
  fechaInicio?: Date | string;
  fechaFinal?: Date | string;
  horaInicio?: string;
  horaFinal?: string;
  bundleDetailImages?: string[]; // URLs de imágenes de detalle para bundles
}

// Mapeo de colores de la API a colores del frontend
const colorMap: Record<string, { hex: string; label: string }> = {
  'azul': { hex: '#1E40AF', label: 'Azul' },
  'azul medianoche': { hex: '#1E40AF', label: 'Azul Medianoche' },
  'azul claro': { hex: '#3C5B8A', label: 'Azul Claro' },
  'negro': { hex: '#000000', label: 'Negro' },
  'negro titanio': { hex: '#1F2937', label: 'Negro Titanio' },
  'negro medianoche': { hex: '#000000', label: 'Negro Medianoche' },
  'blanco': { hex: '#FFFFFF', label: 'Blanco' },
  'blanco perla': { hex: '#FFFFFF', label: 'Blanco Perla' },
  'verde': { hex: '#10B981', label: 'Verde' },
  'verde menta': { hex: '#10B981', label: 'Verde Menta' },
  'rosado': { hex: '#EC4899', label: 'Rosa' },
  'rosa': { hex: '#EC4899', label: 'Rosa' },
  'coral': { hex: '#EE6779', label: 'Coral' },
  'co': { hex: '#EE6779', label: 'Coral' },
  'gris': { hex: '#808080', label: 'Gris' },
  'gris titanio': { hex: '#4B5563', label: 'Gris Titanio' },
  'gris grafito': { hex: '#4B5563', label: 'Gris Grafito' },
  'plateado': { hex: '#C0C0C0', label: 'Plateado' },
  'dorado': { hex: '#D4AF37', label: 'Dorado' },
  'oro': { hex: '#D4AF37', label: 'Dorado' },
  'oro rosa': { hex: '#E8B4B8', label: 'Oro Rosa' },
  'rojo': { hex: '#DC2626', label: 'Rojo' },
  'amarillo': { hex: '#F59E0B', label: 'Amarillo' },
  'morado': { hex: '#7C3AED', label: 'Morado' },
  'purpura': { hex: '#7C3AED', label: 'Morado' },
  'morado lavanda': { hex: '#B19CD9', label: 'Morado Lavanda' },
  'beige': { hex: '#F5F5DC', label: 'Beige' },
  'marron': { hex: '#8B4513', label: 'Marrón' },
  'no aplica': { hex: '#F3F4F6', label: 'Estándar' },
};

/**
 * Convierte un producto de la API al formato del frontend
 * Ahora agrupa por codigoMarket y maneja múltiples variantes de color
 */
export function mapApiProductToFrontend(apiProduct: ProductApiData): ProductCardProps {
  console.log("Mapping API product:", apiProduct);


  // Determinar imagen basada en categoría/subcategoría
  const image = getProductImage(apiProduct);
  
  // Crear colores del producto (ahora maneja arrays)
  const colors: ProductColor[] = createProductColorsFromArray(apiProduct);


  
  // Calcular precios y descuentos (usar el primer precio disponible)
  const { price, originalPrice, discount, isNew } = calculatePricingFromArray(apiProduct);
  
  const id = apiProduct.codigoMarketBase;

  
  const capacidadArray = Array.isArray(apiProduct.capacidad) ? apiProduct.capacidad : [];
  const stockArray = Array.isArray(apiProduct.stock) ? apiProduct.stock : [];
  const stockTotal = apiProduct.stockTotal?.reduce((acc, num) => acc + num, 0) ?? 0;
  const skuArray = Array.isArray(apiProduct.sku) ? apiProduct.sku : [];
  const desDetalladaArray = Array.isArray(apiProduct.desDetallada) ? apiProduct.desDetallada : [];

  const segmentoArray = Array.isArray(apiProduct.segmento) ? apiProduct.segmento : [];

  // Manejar nombreMarket como array o string
  const nombreMarketArray = Array.isArray(apiProduct.nombreMarket) 
    ? apiProduct.nombreMarket 
    : [apiProduct.nombreMarket];
  const name = nombreMarketArray.length > 0 ? nombreMarketArray[0] : 'Producto sin nombre';

  // Manejar modelo como array o string
  const modeloArray = Array.isArray(apiProduct.modelo) 
    ? apiProduct.modelo 
    : [apiProduct.modelo];
  const model = modeloArray.length > 0 ? modeloArray[0] : '';

  return {
    id,
    name,
    image,
    colors,
    price,
    originalPrice,
    discount,
    isNew,
    rating: 4.5, // Valor por defecto, se puede obtener de reviews en el futuro
    reviewCount: Math.floor(Math.random() * 500) + 50, // Valor temporal
    // Datos adicionales para la página de detalle
    description: apiProduct.descGeneral || null,
    brand: "Samsung", // Por defecto, se puede obtener de la API en el futuro
    model,
    category: apiProduct.categoria,
    menu: apiProduct.menu,
    capacity: capacidadArray.length > 0 ? capacidadArray.join(', ') : null,
    stock: stockArray.reduce((sum, s) => sum + s, 0),
    stockTotal: stockTotal,
    sku: skuArray.length > 0 ? skuArray.join(', ') : null,
    detailedDescription: desDetalladaArray.length > 0 ? desDetalladaArray.join(' ') : null,
    segmento: segmentoArray,
  };
}

/**
 * Obtiene la imagen apropiada para el producto
 */
function getProductImage(apiProduct: ProductApiData): string | StaticImageData {
  // Si hay URL de imagen en la API, usarla (cuando esté disponible)
  const imagePreviewArray = Array.isArray(apiProduct.imagePreviewUrl) ? apiProduct.imagePreviewUrl : [];
  const firstImageUrl = imagePreviewArray.find(url => url && url.trim() !== '');
  if (firstImageUrl) {
    return firstImageUrl;
  }

  // Usar imagen por defecto cuando no hay imagen de la API
  return emptyImg;
}

/**
 * Crea el array de variantes del producto agrupando por color + capacidad + RAM
 * Cada variante única tendrá su propio precio, stock, SKU e imágenes
 */
function createProductColorsFromArray(apiProduct: ProductApiData): ProductColor[] {
  const variants: ProductColor[] = [];

  // Crear una clave única para cada combinación de color + capacidad + RAM
  interface VariantData {
    color: string;
    capacity?: string;
    ram?: string;
    precioNormal: number;
    precioDescto: number;
    index: number;
  }

  const variantMap = new Map<string, VariantData>();

  // Arrays de datos
  const colorsArray = Array.isArray(apiProduct.color) ? apiProduct.color : [];
  const capacidadArray = Array.isArray(apiProduct.capacidad) ? apiProduct.capacidad : [];
  const ramArray = Array.isArray(apiProduct.memoriaram) ? apiProduct.memoriaram : [];
  const preciosNormales = Array.isArray(apiProduct.precioNormal) ? apiProduct.precioNormal : [];
  const preciosDescto = Array.isArray(apiProduct.precioDescto) ? apiProduct.precioDescto : [];

  const nombreMarketForLog = Array.isArray(apiProduct.nombreMarket) 
    ? apiProduct.nombreMarket[0] 
    : apiProduct.nombreMarket;
  console.log(`  - Colores: ${colorsArray.length} items`);
  console.log(`  - Capacidades: ${capacidadArray.length} items`);
  console.log(`  - RAM: ${ramArray.length} items`);
  console.log(`  - Primeras 3 capacidades:`, capacidadArray.slice(0, 3));
  console.log(`  - Primeras 3 RAM:`, ramArray.slice(0, 3));

  // Primero, crear un array de índices con información de prioridad
  // para procesar primero los SKUs que no tienen "F-" al inicio
  const skuArray = Array.isArray(apiProduct.sku) ? apiProduct.sku : [];
  const indicesWithPriority = colorsArray.map((_, index) => ({
    index,
    sku: skuArray[index] || '',
    hasFPrefix: skuArray[index]?.startsWith('F-') || false
  }));

  // Ordenar: primero los que NO tienen "F-", luego los que sí
  indicesWithPriority.sort((a, b) => {
    if (a.hasFPrefix === b.hasFPrefix) return 0;
    return a.hasFPrefix ? 1 : -1; // false viene antes que true
  });

  // Iterar sobre todos los índices ordenados para agrupar por características (color+capacidad+RAM)
  // Múltiples SKUs con mismas características se combinarán (sumando stocks)
  indicesWithPriority.forEach(({ index }) => {
    const color = colorsArray[index];
    const precioNormal = preciosNormales[index] || 0;
    const precioDescto = preciosDescto[index] || 0;

    // Solo incluir variantes con precios válidos
    if (precioNormal > 0 || precioDescto > 0) {
      const capacity = capacidadArray[index] || undefined;
      const ram = ramArray[index] || undefined;

      // Crear clave única basada en color + capacidad + RAM
      // Normalizar el color para que variaciones sean tratadas como el mismo color
      const normalizedColor = normalizeColorValue(color);
      const key = `${normalizedColor}|${capacity || 'NA'}|${ram || 'NA'}`;

      // Si ya existe esta combinación, solo actualizar si el nuevo NO tiene "F-"
      // Esto maneja el caso de múltiples SKUs para la misma variante
      if (variantMap.has(key)) {
        const existing = variantMap.get(key)!;
        const existingSku = skuArray[existing.index] || '';
        const currentSku = skuArray[index] || '';
        
        // Verificar si el existente o el actual tienen prefijo "F-"
        const existingHasFPrefix = existingSku.startsWith('F-');
        const currentHasFPrefix = currentSku.startsWith('F-');
        
        // Priorizar SKUs sin "F-" al inicio
        let shouldReplace = false;
        
        if (!currentHasFPrefix && existingHasFPrefix) {
          // Si el actual NO tiene "F-" y el existente SÍ, reemplazar
          shouldReplace = true;
        } else if (currentHasFPrefix === existingHasFPrefix) {
          // Si ambos tienen el mismo prefijo "F-", mantener la lógica original de stock/precio
          const currentStock = Array.isArray(apiProduct.stockTotal) ? (apiProduct.stockTotal[index] || 0) : 0;
          const existingStock = Array.isArray(apiProduct.stockTotal) ? (apiProduct.stockTotal[existing.index] || 0) : 0;
          shouldReplace = currentStock > existingStock ||
            (currentStock === existingStock && precioDescto > 0 && precioDescto < existing.precioDescto);
        }

        if (shouldReplace) {
          variantMap.set(key, {
            color: normalizedColor,
            capacity,
            ram,
            precioNormal,
            precioDescto,
            index
          });
        }
      } else {
        // Primera vez que vemos esta combinación
        variantMap.set(key, {
          color: normalizedColor,
          capacity,
          ram,
          precioNormal,
          precioDescto,
          index
        });
      }
    }
  });

  // ✅ PASO 1: Crear mapa de imagen_final_premium por color (hex)
  // La imagen premium del dispositivo se aplica a TODOS los SKUs del mismo color
  const devicePremiumImageByColor = new Map<string, string | null>();
  
  // Primero, buscar la imagen_final_premium para cada color único
  const imagenFinalPremiumArray = Array.isArray(apiProduct.imagen_final_premium) 
    ? apiProduct.imagen_final_premium 
    : [];
  
  // Iterar sobre todos los índices originales para encontrar imágenes por color
  // Tomar la primera imagen válida encontrada para cada color único (por hex)
  const colorArray = Array.isArray(apiProduct.color) ? apiProduct.color : [];
  colorArray.forEach((color, idx) => {
    if (idx < imagenFinalPremiumArray.length) {
      const colorInfo = getColorInfo(color);
      const hex = colorInfo.hex;
      
      // Si este color aún no tiene imagen asignada, buscar la primera imagen válida
      if (!devicePremiumImageByColor.has(hex)) {
        const imageValue = imagenFinalPremiumArray[idx];
        // Solo asignar si es una URL válida (no null, no undefined, no string vacío)
        if (imageValue !== undefined && imageValue !== null && 
            typeof imageValue === 'string' && imageValue.trim() !== '' &&
            imageValue.startsWith('http')) {
          devicePremiumImageByColor.set(hex, imageValue);
        } else {
          // Si no hay imagen válida, marcar como null
          devicePremiumImageByColor.set(hex, null);
        }
      }
    }
  });
  
  // Si algún color no se encontró en el array, marcarlo como null por defecto
  variantMap.forEach((variantData) => {
    const { color } = variantData;
    const colorInfo = getColorInfo(color);
    const hex = colorInfo.hex;
    if (!devicePremiumImageByColor.has(hex)) {
      devicePremiumImageByColor.set(hex, null);
    }
  });

  // Convertir el mapa a array de ProductColor
  variantMap.forEach((variantData) => {
    const { color, capacity, ram, precioNormal, precioDescto, index } = variantData;

    // Obtener información del color (hex y label)
    const colorInfo = getColorInfo(color);

    // Formatear precios
    const formatPrice = (price: number) => `$ ${price.toLocaleString('es-CO')}`;

    const precioFinal = precioDescto > 0 ? precioDescto : precioNormal;
    const price = formatPrice(precioFinal);

    let originalPrice: string | undefined;
    let discount: string | undefined;

    // Si hay descuento real
    if (precioDescto > 0 && precioDescto < precioNormal && precioNormal > 0) {
      originalPrice = formatPrice(precioNormal);
      const discountPercent = Math.round(((precioNormal - precioDescto) / precioNormal) * 100);
      discount = `-${discountPercent}%`;
    }

    // Obtener información específica de esta variante
    const skuArray = Array.isArray(apiProduct.sku) ? apiProduct.sku : [];
    const stockArray = Array.isArray(apiProduct.stock) ? apiProduct.stock : [];
    const stockTiendasArray = Array.isArray(apiProduct.stockTiendas) ? apiProduct.stockTiendas : [];
    const stockTotalArray = Array.isArray(apiProduct.stockTotal) ? apiProduct.stockTotal : [];
    const desDetalladaArray = Array.isArray(apiProduct.desDetallada) ? apiProduct.desDetallada : [];
    const imagePreviewArray = Array.isArray(apiProduct.imagePreviewUrl) ? apiProduct.imagePreviewUrl : [];
    const imageDetailsArray = Array.isArray(apiProduct.imageDetailsUrls) ? apiProduct.imageDetailsUrls : [];
    const urlImagenesArray = Array.isArray(apiProduct.urlImagenes) ? apiProduct.urlImagenes : [];
    // ✅ NUEVA ARQUITECTURA SIMPLIFICADA (con compatibilidad para formato antiguo)
    // Intentar primero con el nuevo formato (snake_case), luego con el antiguo (camelCase)
    const imagenPremiumArray = Array.isArray(apiProduct.imagen_premium) 
      ? apiProduct.imagen_premium 
      : (Array.isArray((apiProduct as any).imagenPremium) ? (apiProduct as any).imagenPremium : []);
    
    const videoPremiumArray = Array.isArray(apiProduct.video_premium) 
      ? apiProduct.video_premium 
      : (Array.isArray((apiProduct as any).videoPremium) ? (apiProduct as any).videoPremium : []);

    // Datos específicos de este índice
    const sku = skuArray[index] || '';
    const stockEcommerce = stockArray[index] || 0;
    const stockTiendas = stockTiendasArray[index] || {};
    const stockTotalVariant = stockTotalArray[index] || 0;
    const description = desDetalladaArray[index] || '';

    // Imagen preview
    const imageUrl = imagePreviewArray[index] && imagePreviewArray[index].trim() !== ''
      ? imagePreviewArray[index]
      : undefined;

    // Imágenes detalladas
    let imageDetailsUrls: string[] | undefined;
    if (imageDetailsArray[index]) {
      const filteredUrls = imageDetailsArray[index].filter(url => url && url.trim() !== '');
      imageDetailsUrls = filteredUrls.length > 0 ? filteredUrls : [emptyImg.src];
    } else if (urlImagenesArray[index]) {
      const filteredUrls = urlImagenesArray[index].split(',').map(url => url.trim()).filter(url => url !== '');
      imageDetailsUrls = filteredUrls.length > 0 ? filteredUrls : [emptyImg.src];
    } else {
      imageDetailsUrls = [emptyImg.src];
    }

    // ✅ NUEVA ARQUITECTURA SIMPLIFICADA
    // Imágenes premium del CARRUSEL (array simple de strings, sin marcadores especiales)
    // IMPORTANTE: Filtrar "" (string vacío) que era el marcador de "sin premium" en la arquitectura antigua
    // TODAS las imágenes en imagenPremium van al carrusel (excepto "")
    const premiumImages = imagenPremiumArray[index] && Array.isArray(imagenPremiumArray[index])
      ? imagenPremiumArray[index].filter((url): url is string => 
          typeof url === 'string' && 
          url.trim() !== '' && 
          url !== '""' && // Filtrar string vacío
          url.startsWith('http')
        )
      : undefined;

    // ✅ Imagen premium del DISPOSITIVO agrupada por COLOR (hex)
    // La misma imagen se aplica a TODOS los SKUs del mismo color
    const devicePremiumImage = devicePremiumImageByColor.get(colorInfo.hex) || null;

    // Videos premium del CARRUSEL (array simple de strings)
    const premiumVideos = videoPremiumArray[index] && Array.isArray(videoPremiumArray[index])
      ? videoPremiumArray[index].filter((url): url is string => 
          typeof url === 'string' && url.trim() !== '' && url.startsWith('http')
        )
      : undefined;

    variants.push({
      name: color.toLowerCase().replace(/\s+/g, '-'),
      hex: colorInfo.hex,
      label: colorInfo.label,
      sku,
      price,
      originalPrice,
      discount,
      stock: stockEcommerce,
      stockTiendas,
      stockTotal: stockTotalVariant,
      description,
      capacity,
      ram,
      imageUrl,
      imageDetailsUrls,
      premiumImages, // Imágenes del CARRUSEL premium (array)
      devicePremiumImage, // Imagen premium del DISPOSITIVO (string|null)
      premiumVideos // Videos del CARRUSEL premium (array)
    });
  });

  console.log(`[ProductMapper] Total de variantes creadas: ${variants.length}`);
  console.log(`[ProductMapper] Primeras 3 variantes:`, variants.slice(0, 3).map(v => ({
    hex: v.hex,
    label: v.label,
    capacity: v.capacity,
    ram: v.ram,
    sku: v.sku,
    stockTotal: v.stockTotal
  })));

  return variants;
}

/**
 * Normaliza el valor del color para agrupar variaciones
 * Por ejemplo: "#000000" y "Negro" deberían ser tratados como el mismo color
 */
function normalizeColorValue(color: string): string {
  // Si es un código hex, devolverlo tal cual
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return color.toLowerCase();
  }

  // Para nombres de colores, normalizar y buscar en el colorMap
  const normalized = color.toLowerCase().trim();

  // Buscar en el colorMap para obtener el hex correspondiente
  let colorInfo = colorMap[normalized];

  if (!colorInfo) {
    for (const [key, value] of Object.entries(colorMap)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        colorInfo = value;
        break;
      }
    }
  }

  // Si encontramos el color en el mapa, usar su hex como identificador
  if (colorInfo) {
    return colorInfo.hex.toLowerCase();
  }

  // Si no se encuentra, usar el nombre normalizado
  return normalized;
}

/**
 * Obtiene la información del color (hex y label) desde un valor normalizado
 */
function getColorInfo(normalizedColor: string): { hex: string; label: string } {
  // Si es un código hex directo
  if (/^#[0-9A-Fa-f]{6}$/i.test(normalizedColor)) {
    // Buscar en el colorMap por el hex
    for (const [key, value] of Object.entries(colorMap)) {
      if (value.hex.toLowerCase() === normalizedColor.toLowerCase()) {
        return value;
      }
    }
    // Si no se encuentra, usar el hex tal cual
    return { hex: normalizedColor, label: normalizedColor.substring(1).toUpperCase() };
  }

  // Buscar por nombre
  let colorInfo = colorMap[normalizedColor];

  if (!colorInfo) {
    for (const [key, value] of Object.entries(colorMap)) {
      if (normalizedColor.includes(key) || key.includes(normalizedColor)) {
        colorInfo = value;
        break;
      }
    }
  }

  if (colorInfo) {
    return colorInfo;
  }

  // Valor por defecto
  return { hex: '#808080', label: normalizedColor.charAt(0).toUpperCase() + normalizedColor.slice(1) };
}

/**
 * Calcula precios, descuentos y si es producto nuevo desde arrays
 * Retorna información completa de precios por variante de color
 */
function calculatePricingFromArray(apiProduct: ProductApiData) {
  // Filtrar precios válidos (mayores a 0)
  const preciosNormalesValidos = Array.isArray(apiProduct.precioNormal)
    ? apiProduct.precioNormal.filter(p => p > 0)
    : [];
  const preciosDescuentoValidos = Array.isArray(apiProduct.precioDescto)
    ? apiProduct.precioDescto.filter(p => p > 0)
    : [];
  
  // Si no hay precios válidos, usar valores por defecto
  if (preciosNormalesValidos.length === 0 && preciosDescuentoValidos.length === 0) {
    return {
      price: "Precio no disponible",
      originalPrice: undefined,
      discount: undefined,
      isNew: false,
    };
  }
  
  // Usar el primer precio disponible (o el más bajo si hay múltiples)
  const precioNormal = preciosNormalesValidos.length > 0 
    ? Math.min(...preciosNormalesValidos) 
    : 0;
  const precioDescto = preciosDescuentoValidos.length > 0 
    ? Math.min(...preciosDescuentoValidos) 
    : precioNormal;
  
  // Formatear precios a formato colombiano
  const formatPrice = (price: number) => `$ ${price.toLocaleString('es-CO')}`;
  
  const price = formatPrice(precioDescto);
  let originalPrice: string | undefined;
  let discount: string | undefined;
  
  // Si hay descuento real
  if (precioDescto < precioNormal && precioNormal > 0) {
    originalPrice = formatPrice(precioNormal);
    const discountPercent = Math.round(((precioNormal - precioDescto) / precioNormal) * 100);
    discount = `-${discountPercent}%`;
  }
  
  // Determinar si es producto nuevo (menos de 30 días desde fecha de inicio)
  const fechaVigenciaArray = Array.isArray(apiProduct.fechaInicioVigencia) ? apiProduct.fechaInicioVigencia : [];
  const fechaInicio = fechaVigenciaArray.length > 0 && fechaVigenciaArray[0]
    ? new Date(fechaVigenciaArray[0])
    : new Date();
  const ahora = new Date();
  const diasDiferencia = (ahora.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24);
  const isNew = diasDiferencia < 30;
  
  return {
    price,
    originalPrice,
    discount,
    isNew,
  };
}

/**
 * Convierte múltiples productos de la API
 * Filtra productos sin precios válidos
 */
export function mapApiProductsToFrontend(apiProducts: ProductApiData[]): ProductCardProps[] {
  return apiProducts
    .map(mapApiProductToFrontend);
}

/**
 * Función de utilidad para debuggear colores
 * Útil para identificar inconsistencias en el mapeo de colores
 */
export function debugColorMapping(color: string): { hex: string; label: string; normalized: string } {
  const normalizedColor = color.toLowerCase().trim();
  const colorInfo = colorMap[normalizedColor] || { hex: '#808080', label: color };
  
  return {
    hex: colorInfo.hex,
    label: colorInfo.label,
    normalized: normalizedColor
  };
}

/**
 * Agrupa productos por categoría 
 */
export function groupProductsByCategory(products: ProductCardProps[]): Record<string, ProductCardProps[]> {
  const grouped: Record<string, ProductCardProps[]> = {
    'accesorios': [],
    'tv-monitores-audio': [],
    'smartphones-tablets': [],
    'electrodomesticos': [],
  };
  
  products.forEach(product => {
    // Manejar name como string o array (defensivo)
    const productName = Array.isArray(product.name) 
      ? product.name[0] || '' 
      : (typeof product.name === 'string' ? product.name : '');
    
    const nameLower = productName.toLowerCase();
    
    // Mapear categorías de la API a categorías del frontend
    if (nameLower.includes('buds') || 
        nameLower.includes('watch') ||
        nameLower.includes('cargador') ||
        nameLower.includes('funda')) {
      grouped['accesorios'].push(product);
    } else if (nameLower.includes('tv') ||
               nameLower.includes('monitor') ||
               nameLower.includes('soundbar')) {
      grouped['tv-monitores-audio'].push(product);
    } else if (nameLower.includes('galaxy') ||
               nameLower.includes('tab') ||
               nameLower.includes('celular')) {
      grouped['smartphones-tablets'].push(product);
    } else {
      grouped['electrodomesticos'].push(product);
    }
  });
  
  return grouped;
}

/**
 * Mapea un ProductBundle de la API a ProductCardProps
 */
export function mapBundleToFrontend(bundle: ProductBundle): ProductCardProps {
  const formatPrice = (price: number) => `$ ${price.toLocaleString('es-CO')}`;
  
  // bundle_price es el precio CON descuento (precio actual)
  const price = bundle.bundle_price ? formatPrice(bundle.bundle_price) : 'Precio no disponible';
  
  // bundle_discount es un MONTO monetario (no porcentaje)
  // Precio original = precio con descuento + monto del descuento
  let originalPrice: string | undefined;
  if (bundle.bundle_discount && bundle.bundle_price && bundle.bundle_discount > 0) {
    const precioOriginal = bundle.bundle_price + bundle.bundle_discount;
    originalPrice = formatPrice(precioOriginal);
  }
  
  // El descuento se muestra como monto monetario (no porcentaje) en la tabla
  // Para la página de detalle, no usamos discount string, sino bundleDiscount (number)
  const discount = undefined; // No mostrar porcentaje, el descuento se muestra en bundleDiscount

  // Convertir fechas de string a Date si es necesario
  const fechaInicio = typeof bundle.fecha_inicio === 'string' 
    ? new Date(bundle.fecha_inicio) 
    : bundle.fecha_inicio;
  const fechaFinal = typeof bundle.fecha_final === 'string' 
    ? new Date(bundle.fecha_final) 
    : bundle.fecha_final;

  // Determinar si es nuevo (menos de 30 días desde fecha de inicio)
  const ahora = new Date();
  const diasDiferencia = fechaInicio instanceof Date 
    ? (ahora.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)
    : 31; // Si no hay fecha válida, no marcarlo como nuevo
  const isNew = diasDiferencia < 30;

  // ✨ Obtener imagen preview del bundle si está disponible (igual que productos normales)
  // Prioridad: 1) imagePreviewUrl, 2) primera imagen de imageDetailsUrls, 3) emptyImg
  let bundleImage: string | StaticImageData = emptyImg;
  
  // 1. Intentar usar imagePreviewUrl primero
  if (bundle.imagePreviewUrl && Array.isArray(bundle.imagePreviewUrl) && bundle.imagePreviewUrl.length > 0) {
    const firstImageUrl = bundle.imagePreviewUrl.find(url => url && url.trim() !== '');
    if (firstImageUrl) {
      bundleImage = firstImageUrl;
    }
  }
  
  // 2. Si imagePreviewUrl está vacío pero imageDetailsUrls tiene imágenes, usar la primera de detalle
  if (bundleImage === emptyImg && bundle.imageDetailsUrls && Array.isArray(bundle.imageDetailsUrls) && bundle.imageDetailsUrls.length > 0) {
    const firstDetailArray = bundle.imageDetailsUrls[0];
    if (firstDetailArray && Array.isArray(firstDetailArray) && firstDetailArray.length > 0) {
      const firstDetailImage = firstDetailArray.find(url => url && url.trim() !== '');
      if (firstDetailImage) {
        bundleImage = firstDetailImage;
      }
    }
  }

  // ✨ Obtener imágenes de detalle del bundle si están disponibles
  let bundleDetailImages: string[] | undefined = undefined;
  if (bundle.imageDetailsUrls && Array.isArray(bundle.imageDetailsUrls) && bundle.imageDetailsUrls.length > 0) {
    // Para bundles, tomar el primer array de URLs de detalle (similar a productos normales)
    const firstDetailArray = bundle.imageDetailsUrls[0];
    if (firstDetailArray && Array.isArray(firstDetailArray) && firstDetailArray.length > 0) {
      const filteredUrls = firstDetailArray.filter(url => url && url.trim() !== '');
      bundleDetailImages = filteredUrls.length > 0 ? filteredUrls : [emptyImg.src];
    }
  }

  return {
    id: bundle.product_sku,
    name: bundle.modelo,
    image: bundleImage, // ✨ Usar imagen del bundle si está disponible
    colors: [], // Los bundles no tienen variantes de color (pero podrían tener imágenes de detalle)
    price,
    originalPrice,
    discount,
    isNew,
    rating: 4.5,
    reviewCount: 0,
    description: `Bundle compuesto por: ${bundle.skus_bundle.join(', ')}`,
    brand: "Samsung",
    model: bundle.modelo,
    category: bundle.categoria,
    menu: bundle.menu,
    capacity: null,
    stock: 0, // Los bundles no tienen stock individual
    stockTotal: 0,
    sku: bundle.product_sku,
    detailedDescription: `Incluye: ${bundle.skus_bundle.join(', ')}`,
    segmento: [],
    // Campos específicos de bundle
    isBundle: true,
    bundlePrice: bundle.bundle_price,
    bundleDiscount: bundle.bundle_discount,
    skusBundle: bundle.skus_bundle,
    fechaInicio: fechaInicio,
    fechaFinal: fechaFinal,
    horaInicio: bundle.hora_inicio,
    horaFinal: bundle.hora_final,
    bundleDetailImages, // ✨ Imágenes de detalle para bundles
  };
}

/**
 * Mapea un ProductGrouped de la API a ProductCardProps
 */
export function mapGroupedProductToFrontend(product: ProductGrouped): ProductCardProps {
  // Usar el mapper existente, pero primero necesitamos convertir ProductGrouped a ProductApiData
  const apiProduct: ProductApiData = {
    ...product,
    precioNormal: product.precioeccommerce || product.precioNormal,
  };
  
  return mapApiProductToFrontend(apiProduct);
}

/**
 * Mapea un array mixto de ProductBundle | ProductGrouped a ProductCardProps[]
 */
export function mapBundlesAndProductsToFrontend(
  items: (ProductBundle | ProductGrouped)[]
): ProductCardProps[] {
  return items.map(item => {
    if (item.isBundle === true) {
      return mapBundleToFrontend(item);
    } else {
      return mapGroupedProductToFrontend(item);
    }
  });
}
