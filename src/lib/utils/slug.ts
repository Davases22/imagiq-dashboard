/**
 * Genera un slug URL-friendly desde un string
 * @param title - Título a convertir en slug
 * @returns Slug en formato URL-friendly
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '') // Remover acentos
    .replaceAll(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replaceAll(/\s+/g, '-') // Espacios a guiones
    .replaceAll(/-+/g, '-') // Múltiples guiones a uno
    .substring(0, 50) // Limitar longitud
    .replaceAll(/(?:^-+)|(?:-+$)/g, ''); // Remover guiones al inicio/final
}
