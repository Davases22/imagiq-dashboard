/**
 * API functions para gestión de contenido multimedia premium
 * Maneja videos, imágenes de carrusel e imágenes de dispositivo
 */

import { getApiKey } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ==================== VIDEOS DE CARRUSEL ====================

/**
 * Subir videos de carrusel para TODOS los SKUs del producto
 * @param skus - Array de SKUs a los que se aplicarán los videos
 * @param files - Archivos de video a subir
 */
export async function uploadCarouselVideos(skus: string[], files: File[]) {
  const formData = new FormData();

  files.forEach(file => {
    formData.append('files', file);
  });
  formData.append('skus', JSON.stringify(skus));

  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/carrusel/videos`, {
    method: 'PUT',
    body: formData,
    headers: {
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
  });

  const data = await response.json();
  return {
    success: response.ok,
    data,
    message: data.message,
  };
}

/**
 * Eliminar un video de carrusel de TODOS los SKUs especificados
 * @param skus - Array de SKUs de los que se eliminará el video
 * @param videoUrl - URL del video a eliminar
 */
export async function deleteCarouselVideo(skus: string[], videoUrl: string) {
  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/carrusel/video`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
    body: JSON.stringify({ skus, videoUrl }),
  });

  const data = await response.json();
  return {
    success: response.ok,
    data,
    message: data.message,
  };
}

// ==================== IMÁGENES DE CARRUSEL ====================

/**
 * Subir imágenes de carrusel para TODOS los SKUs del producto
 * 
 * ✅ NUEVA ARQUITECTURA SIMPLIFICADA:
 * - Agrega imágenes al array `imagen_premium` (carrusel)
 * - NO afecta `imagen_final_premium` (imagen del dispositivo)
 * - Las nuevas imágenes se agregan al array existente
 * - Array simple de strings (sin marcadores especiales)
 * 
 * @param skus - Array de SKUs del producto (mismo codigoMarketBase)
 * @param files - Archivos de imagen a subir
 */
export async function uploadCarouselImages(skus: string[], files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }
  formData.append('skus', JSON.stringify(skus));

  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/carrusel/imagenes`, {
    method: 'PUT',
    body: formData,
    headers: {
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
  });

  const data = await response.json();
  return {
    success: response.ok,
    data,
    message: data.message,
  };
}

/**
 * Eliminar una imagen de carrusel de TODOS los SKUs especificados
 * 
 * ✅ NUEVA ARQUITECTURA SIMPLIFICADA:
 * - Elimina una imagen del array `imagen_premium` (carrusel)
 * - NO afecta `imagen_final_premium` (imagen del dispositivo)
 * - El frontend debe enviar el array YA filtrado (sin la imagen eliminada)
 * - Array simple de strings (sin marcadores especiales)
 * 
 * @param skus - Array de SKUs del producto
 * @param imageUrl - URL de la imagen a eliminar
 * @param updatedArray - Array COMPLETO actualizado (sin la imagen eliminada)
 */
export async function deleteCarouselImage(skus: string[], imageUrl: string, updatedArray: string[]) {
  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/carrusel/imagen`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
    body: JSON.stringify({ 
      skus, 
      imageUrl,
      imagenPremium: updatedArray // Array completo YA filtrado
    }),
  });

  const data = await response.json();
  return {
    success: response.ok,
    data,
    message: data.message,
  };
}

/**
 * Reordenar/Actualizar array completo de imágenes del carrusel para TODOS los SKUs
 * 
 * ✅ NUEVA ARQUITECTURA SIMPLIFICADA:
 * - Actualiza SOLO el array `imagen_premium` (carrusel)
 * - NO afecta `imagen_final_premium` (imagen del dispositivo)
 * - Array simple de strings (sin marcadores especiales)
 * - Si el array está vacío [], el backend guarda [] vacío
 * - NO se permiten valores null o undefined en el array
 * 
 * @param skus - Array de SKUs en los que se actualizará el array
 * @param imageArray - Array de URLs de imágenes del carrusel en el orden final
 */
export async function reorderCarouselImages(skus: string[], imageArray: string[]) {
  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/carrusel/reordenar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
    body: JSON.stringify({ 
      skus, 
      // ✅ Backend espera camelCase: imagenPremium
      imagenPremium: imageArray // Array simple de strings del carrusel
    }),
  });

  const data = await response.json();
  return {
    success: response.ok,
    data,
    message: data.message,
  };
}

// ==================== IMAGEN DE DISPOSITIVO ====================

/**
 * Subir imagen de dispositivo para UN SKU específico
 * Se coloca en la última posición del array imagen_premium
 * @param sku - SKU específico al que se aplicará la imagen
 * @param file - Archivo de imagen a subir
 */
export async function uploadDeviceImage(sku: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/${sku}/imagen-dispositivo`, {
    method: 'PUT',
    body: formData,
    headers: {
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
  });

  const data = await response.json();
  return {
    success: response.ok,
    data,
    message: data.message,
  };
}

/**
 * Eliminar imagen de dispositivo de UN SKU específico
 * Permite dejar el array vacío o solo con imágenes de carrusel
 * @param sku - SKU del que se eliminará la imagen de dispositivo
 */
export async function deleteDeviceImage(sku: string) {
  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/${sku}/imagen-dispositivo`, {
    method: 'DELETE',
    headers: {
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
  });

  const data = await response.json();
  return {
    success: response.ok,
    data,
    message: data.message,
  };
}

/**
 * Subir/Actualizar imagen premium del dispositivo para TODOS los SKUs del mismo color
 * 
 * ✅ NUEVA ARQUITECTURA SIMPLIFICADA:
 * - Actualiza el campo `imagen_final_premium` (imagen del dispositivo)
 * - NO afecta `imagen_premium` (carrusel)
 * - Si ya existe una imagen, se reemplaza automáticamente
 * - Se aplica a TODOS los SKUs del mismo color (mismo hex)
 * 
 * @param skus - Array de SKUs del mismo color
 * @param file - Archivo de imagen a subir
 */
export async function uploadDeviceImageForColor(skus: string[], file: File) {
  // 🔍 Debug: Verificar datos antes de enviar
  if (process.env.NODE_ENV === 'development') {
    console.log('📤 [uploadDeviceImageForColor] Enviando:', {
      skus,
      skusLength: skus.length,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }
    });
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('skus', JSON.stringify(skus));

  try {
    const apiKey = getApiKey();
    const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/imagen-dispositivo-color`, {
      method: 'PUT',
      body: formData,
      headers: {
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });

    const data = await response.json();

    // 🔍 Debug: Verificar respuesta
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 [uploadDeviceImageForColor] Respuesta:', {
        status: response.status,
        ok: response.ok,
        data
      });
    }

    if (!response.ok) {
      console.error('❌ [uploadDeviceImageForColor] Error:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
    }

    return {
      success: response.ok,
      data,
      message: data.message,
    };
  } catch (error) {
    console.error('❌ [uploadDeviceImageForColor] Excepción:', error);
    throw error;
  }
}

/**
 * Eliminar imagen premium del dispositivo de TODOS los SKUs del mismo color
 * 
 * ✅ NUEVA ARQUITECTURA SIMPLIFICADA:
 * - Elimina el campo `imagen_final_premium` (lo pone en null)
 * - NO afecta `imagen_premium` (carrusel)
 * - Se aplica a TODOS los SKUs del mismo color (mismo hex)
 * 
 * @param skus - Array de SKUs del mismo color
 * @param updatedArray - NO SE USA (mantener para compatibilidad)
 */
export async function deleteDeviceImageForColor(skus: string[], updatedArray: string[] = []) {
  const apiKey = getApiKey();
  const response = await fetch(`${API_BASE_URL}/api/multimedia/producto/imagen-dispositivo-color`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      skus,
      clearAll: true // Indicar al backend que elimine imagen_final_premium (null)
    }),
  });

  const data = await response.json();
  return {
    success: response.ok,
    data,
    message: data.message,
  };
}
