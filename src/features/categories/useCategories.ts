/**
 * Hook para manejo de categorías del sitio web
 * - Obtener categorías visibles del backend
 * - Manejo de estado de carga y errores
 * - Funciones para actualizar categorías
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { categoryEndpoints } from "@/lib/api";
import { mapBackendCategoriesToFrontend } from "@/lib/categoryMapper";
import { WebsiteCategory, UpdateCategoryRequest } from "@/types";

interface UseCategoriesReturn {
  categories: WebsiteCategory[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  toggleCategoryActive: (categoryId: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<boolean>;
  updatingCategory: string | null; // Para mostrar loading en categoría específica
  deletingCategory: boolean; // Para mostrar loading al eliminar categoría
  updateCategory: (categoryId: string, data: UpdateCategoryRequest) => Promise<boolean>;
  updatingCategoryData: boolean; // Para mostrar loading al actualizar categoría
  syncCategories: () => Promise<boolean>;
  syncingCategories: boolean; // Para mostrar loading al sincronizar categorías
  updateCategoriesOrder: (categoryIds: string[]) => Promise<boolean>;
  updatingOrder: boolean; // Para mostrar loading al actualizar orden
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<WebsiteCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingCategory, setUpdatingCategory] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [updatingCategoryData, setUpdatingCategoryData] = useState(false);
  const [syncingCategories, setSyncingCategories] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState(false);

  // Función para obtener categorías del backend
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await categoryEndpoints.getVisibleCompletas();

      if (response.success && response.data) {
        const mappedCategories = mapBackendCategoriesToFrontend(response.data);
        setCategories(mappedCategories);
      } else {
        const errorMsg = response.message || "Error al cargar categorías";
        console.warn("Categories error:", errorMsg);
        setError(errorMsg);
        // No throw - permitir que la app continúe
      }
    } catch (err) {
      console.warn("Error fetching categories (non-fatal):", err);
      setError("Error de conexión al cargar categorías");
      // No throw - permitir que la app continúe funcionando
      setCategories([]); // Establecer array vacío en lugar de fallar
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para refrescar categorías
  const refreshCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  // Función para cambiar el estado activo de una categoría
  const toggleCategoryActive = useCallback(async (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    setUpdatingCategory(categoryId);
    setError(null);

    try {
      const newActiveStatus = !category.isActive;
      const response = await categoryEndpoints.updateActiveStatus(categoryId, newActiveStatus);

      if (response.success) {
        // Actualizar el estado local solo si la petición fue exitosa
        setCategories(prev =>
          prev.map(cat =>
            cat.id === categoryId ? { ...cat, isActive: newActiveStatus } : cat
          )
        );
      } else {
        setError(response.message || "Error al actualizar el estado de la categoría");
      }
    } catch (err) {
      console.error("Error updating category status:", err);
      setError("Error de conexión al actualizar la categoría");
    } finally {
      setUpdatingCategory(null);
    }
  }, [categories]);

  // Función para eliminar una categoría
  const deleteCategory = useCallback(async (categoryId: string): Promise<boolean> => {
    setDeletingCategory(true);

    try {
      console.log("Deleting category with ID:", categoryId);
      const response = await categoryEndpoints.delete(categoryId);
      console.log("Delete response:", response);

      if (response.success) {
        // Eliminar la categoría del estado local solo si la petición fue exitosa
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        return true;
      } else {
        console.error("Delete failed:", response.message);
        // No establecer error global, retornar false y el componente manejará el error
        return false;
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      return false;
    } finally {
      setDeletingCategory(false);
    }
  }, []);

  // Función para actualizar una categoría
  const updateCategory = useCallback(async (categoryId: string, data: UpdateCategoryRequest): Promise<boolean> => {
    setUpdatingCategoryData(true);
    setError(null);

    try {
      const response = await categoryEndpoints.update(categoryId, data);

      if (response.success && response.data) {
        // Refrescar todas las categorías para obtener datos actualizados del backend
        await fetchCategories();
        return true;
      } else {
        setError(response.message || "Error al actualizar la categoría");
        return false;
      }
    } catch (err) {
      console.error("Error updating category:", err);
      setError("Error de conexión al actualizar la categoría");
      return false;
    } finally {
      setUpdatingCategoryData(false);
    }
  }, [fetchCategories]);

  // Función para sincronizar categorías
  const syncCategories = useCallback(async (): Promise<boolean> => {
    setSyncingCategories(true);
    setError(null);

    try {
      const response = await categoryEndpoints.sync();

      if (response.success) {
        // Refrescar todas las categorías para obtener datos actualizados del backend
        await fetchCategories();
        return true;
      } else {
        setError(response.message || "Error al sincronizar las categorías");
        return false;
      }
    } catch (err) {
      console.error("Error syncing categories:", err);
      setError("Error de conexión al sincronizar las categorías");
      return false;
    } finally {
      setSyncingCategories(false);
    }
  }, [fetchCategories]);

  // Función para actualizar el orden de las categorías
  const updateCategoriesOrder = useCallback(async (categoryIds: string[]): Promise<boolean> => {
    setUpdatingOrder(true);
    setError(null);

    try {
      const response = await categoryEndpoints.updateOrder(categoryIds);

      if (response.success) {
        // Recargar las categorías para obtener el nuevo orden
        await fetchCategories();
        return true;
      } else {
        setError(response.message || "Error al actualizar el orden");
        return false;
      }
    } catch (error) {
      console.error("Error al actualizar el orden de categorías:", error);
      setError("Error al actualizar el orden de categorías");
      return false;
    } finally {
      setUpdatingOrder(false);
    }
  }, [fetchCategories]);

  // Cargar categorías al montar el componente
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refreshCategories,
    toggleCategoryActive,
    deleteCategory,
    updatingCategory,
    deletingCategory,
    updateCategory,
    updatingCategoryData,
    syncCategories,
    syncingCategories,
    updateCategoriesOrder,
    updatingOrder,
  };
};
