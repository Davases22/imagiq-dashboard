"use client";

import { useState, useEffect, useCallback } from "react";
import { DynamicFilter } from "@/types/filters";
import { filterEndpoints } from "@/lib/api";
import { toast } from "sonner";

// Type definitions for nested API responses
type NestedFilterResponse = {
  data: DynamicFilter;
};

type FilterResponse = DynamicFilter | NestedFilterResponse;

type NestedDeleteBulkResponse = {
  data: {
    deletedCount: number;
  };
};

type DeleteBulkResponse = {
  deletedCount: number;
} | NestedDeleteBulkResponse;

// Filter from API (dates as strings)
type FilterFromAPI = Omit<DynamicFilter, 'createdAt' | 'updatedAt'> & {
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

// Nested array response structure
type NestedFiltersArrayResponse = {
  data: FilterFromAPI[];
};

type FiltersArrayResponse = FilterFromAPI[] | NestedFiltersArrayResponse;

// Type guards
function isNestedFilterResponse(response: FilterResponse): response is NestedFilterResponse {
  return typeof response === 'object' && response !== null && 'data' in response && !('id' in response) && !('sectionName' in response);
}

function isNestedDeleteBulkResponse(response: DeleteBulkResponse): response is NestedDeleteBulkResponse {
  return typeof response === 'object' && response !== null && 'data' in response && !('deletedCount' in response);
}

interface CreateFilterData {
  sectionName: string;
  column: string;
  operator?: string;
  operatorMode: "column" | "per-value";
  valueConfig: DynamicFilter["valueConfig"];
  displayType: string;
  scope: DynamicFilter["scope"];
  order: DynamicFilter["order"];
  isActive: boolean;
}

interface UseFiltersReturn {
  filters: DynamicFilter[];
  isLoading: boolean;
  error: string | null;
  refreshFilters: () => Promise<void>;
  createFilter: (data: CreateFilterData) => Promise<DynamicFilter | null>;
  updateFilter: (id: string, data: Partial<CreateFilterData>) => Promise<DynamicFilter | null>;
  toggleFilterStatus: (id: string, isActive: boolean) => Promise<boolean>;
  deleteFilter: (id: string) => Promise<boolean>;
  deleteBulk: (filterIds: string[]) => Promise<boolean>;
}

export function useFilters(): UseFiltersReturn {
  const [filters, setFilters] = useState<DynamicFilter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert date strings to Date objects
  const parseFilterDates = (filter: FilterFromAPI): DynamicFilter => {
    return {
      ...filter,
      createdAt: filter.createdAt ? (filter.createdAt instanceof Date ? filter.createdAt : new Date(filter.createdAt)) : new Date(),
      updatedAt: filter.updatedAt ? (filter.updatedAt instanceof Date ? filter.updatedAt : new Date(filter.updatedAt)) : new Date(),
    };
  };

  // Fetch all filters
  const fetchFilters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await filterEndpoints.getAll();
      
      // Handle nested response structure: { success: true, data: [...] }
      // The API client wraps it, so we get: response.data = { success: true, data: [...] }
      let filtersArray: FilterFromAPI[] = [];
      
      if (response.success && response.data) {
        const responseData = response.data as FiltersArrayResponse;
        
        // Check if response.data is directly an array
        if (Array.isArray(responseData)) {
          filtersArray = responseData;
        } 
        // Check if response.data is an object (not an array) with nested data property
        else if (typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData) && 'data' in responseData) {
          const nestedResponse = responseData as NestedFiltersArrayResponse;
          if (Array.isArray(nestedResponse.data)) {
            filtersArray = nestedResponse.data;
          }
        }
      }
      
      if (filtersArray.length > 0 || (response.success && filtersArray.length === 0)) {
        const filtersWithDates = filtersArray.map(parseFilterDates);
        setFilters(filtersWithDates);
      } else {
        const errorMsg = response.message || "Error al cargar los filtros";
        setError(errorMsg);
        console.error("Failed to fetch filters from API", { response });
      }
    } catch (err) {
      const errorMsg = "Error de conexión al cargar los filtros";
      setError(errorMsg);
      console.error("Error fetching filters:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load filters on mount
  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Refresh filters
  const refreshFilters = useCallback(async () => {
    await fetchFilters();
  }, [fetchFilters]);

  // Create filter
  const createFilter = useCallback(async (data: CreateFilterData): Promise<DynamicFilter | null> => {
    try {
      const response = await filterEndpoints.create(data);
      
      if (response.success && response.data) {
        // El backend asigna automáticamente el orden, así que la respuesta ya tiene el orden correcto
        const newFilter = parseFilterDates(response.data);
        // Refrescar lista completa para mantener consistencia con el estado del servidor
        await refreshFilters();
        toast.success(response.message || "Filtro creado correctamente");
        return newFilter;
      } else {
        const errorMsg = response.message || "Error al crear el filtro";
        toast.error(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = "Error de conexión al crear el filtro";
      toast.error(errorMsg);
      console.error("Error creating filter:", err);
      return null;
    }
  }, [refreshFilters]);

  // Update filter
  const updateFilter = useCallback(async (id: string, data: Partial<CreateFilterData>): Promise<DynamicFilter | null> => {
    try {
      // Clean up the payload: remove undefined values and ensure proper structure
      const cleanPayload: Partial<CreateFilterData> = {};
      
      if (data.sectionName !== undefined) cleanPayload.sectionName = data.sectionName;
      if (data.column !== undefined) cleanPayload.column = data.column;
      if (data.operator !== undefined) cleanPayload.operator = data.operator;
      if (data.operatorMode !== undefined) cleanPayload.operatorMode = data.operatorMode;
      if (data.valueConfig !== undefined) cleanPayload.valueConfig = data.valueConfig;
      if (data.displayType !== undefined) cleanPayload.displayType = data.displayType;
      if (data.scope !== undefined) cleanPayload.scope = data.scope;
      // No incluir order si se está actualizando el scope - el backend lo maneja automáticamente
      // Solo incluir order si se está actualizando explícitamente el orden
      if (data.order !== undefined) cleanPayload.order = data.order;
      if (data.isActive !== undefined) cleanPayload.isActive = data.isActive;

      console.log("Updating filter with payload:", cleanPayload);
      
      const response = await filterEndpoints.update(id, cleanPayload);
      
      if (response.success && response.data) {
        // Handle nested response structure
        // The API client wraps responses, so response.data might be DynamicFilter or { data: DynamicFilter }
        let filterData: DynamicFilter | null = null;
        const responseData = response.data as FilterResponse;
        
        // Check if response.data is directly the filter object
        if ('id' in responseData || 'sectionName' in responseData) {
          filterData = responseData as DynamicFilter;
        } 
        // Check if response.data has a nested data property (backend response structure)
        else if (isNestedFilterResponse(responseData)) {
          filterData = responseData.data;
        }
        
        if (filterData) {
          const updatedFilter = parseFilterDates(filterData);
          
          // Si se actualizó el scope, refrescar la lista para obtener el orden correcto
          const scopeWasUpdated = data.scope !== undefined;
          
          if (scopeWasUpdated) {
            // El backend maneja automáticamente el orden al actualizar scope
            // Refrescar lista completa para mantener consistencia con el estado del servidor
            await refreshFilters();
            toast.success(response.message || "Filtro actualizado correctamente");
            // Retornar el filtro actualizado de la respuesta (ya tiene el orden correcto)
            return updatedFilter;
          }
          
          // Si no se actualizó el scope, actualizar solo el filtro en el estado
          setFilters((prev) => prev.map((f) => (f.id === id ? updatedFilter : f)));
          toast.success(response.message || "Filtro actualizado correctamente");
          return updatedFilter;
        } else {
          const errorMsg = "Error al procesar la respuesta del servidor";
          toast.error(errorMsg);
          console.error("Invalid response structure:", response);
          return null;
        }
      } else {
        const errorMsg = response.message || "Error al actualizar el filtro";
        toast.error(errorMsg);
        console.error("Update failed:", response);
        return null;
      }
    } catch (err) {
      const errorMsg = "Error de conexión al actualizar el filtro";
      toast.error(errorMsg);
      console.error("Error updating filter:", err);
      return null;
    }
  }, [refreshFilters, fetchFilters]);

  // Toggle filter status (uses PATCH endpoint)
  const toggleFilterStatus = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const response = await filterEndpoints.updatePartial(id, { isActive });
      
      if (response.success && response.data) {
        // Handle nested response structure
        let filterData: DynamicFilter | null = null;
        const responseData = response.data as FilterResponse;
        
        if ('id' in responseData || 'sectionName' in responseData) {
          filterData = responseData as DynamicFilter;
        } else if (isNestedFilterResponse(responseData)) {
          filterData = responseData.data;
        }
        
        if (filterData) {
          const updatedFilter = parseFilterDates(filterData);
          setFilters((prev) => prev.map((f) => (f.id === id ? updatedFilter : f)));
          toast.success(response.message || `Filtro ${isActive ? 'activado' : 'desactivado'} correctamente`);
          return true;
        } else {
          const errorMsg = "Error al procesar la respuesta del servidor";
          toast.error(errorMsg);
          console.error("Invalid response structure:", response);
          return false;
        }
      } else {
        const errorMsg = response.message || "Error al actualizar el estado del filtro";
        toast.error(errorMsg);
        console.error("Toggle status failed:", response);
        return false;
      }
    } catch (err) {
      const errorMsg = "Error de conexión al actualizar el estado del filtro";
      toast.error(errorMsg);
      console.error("Error toggling filter status:", err);
      return false;
    }
  }, []);

  // Delete filter
  const deleteFilter = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await filterEndpoints.delete(id);
      
      if (response.success) {
        // Refrescar lista para obtener el orden reajustado por el backend
        await refreshFilters();
        toast.success(response.message || "Filtro eliminado correctamente");
        return true;
      } else {
        const errorMsg = response.message || "Error al eliminar el filtro";
        toast.error(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = "Error de conexión al eliminar el filtro";
      toast.error(errorMsg);
      console.error("Error deleting filter:", err);
      return false;
    }
  }, [refreshFilters]);

  // Delete multiple filters
  const deleteBulk = useCallback(async (filterIds: string[]): Promise<boolean> => {
    if (filterIds.length === 0) return false;
    
    try {
      const response = await filterEndpoints.deleteBulk({ filterIds });
      
      if (response.success) {
        // Refrescar lista para obtener el orden reajustado por el backend
        await refreshFilters();
        // Handle nested response structure: response.data might be { deletedCount: number } or wrapped
        const responseData = response.data as DeleteBulkResponse | undefined;
        let deletedCount = filterIds.length;
        
        if (responseData) {
          if (isNestedDeleteBulkResponse(responseData)) {
            deletedCount = responseData.data.deletedCount;
          } else if ('deletedCount' in responseData) {
            deletedCount = responseData.deletedCount;
          }
        }
        
        toast.success(response.message || `${deletedCount} filtro(s) eliminado(s) correctamente`);
        return true;
      } else {
        const errorMsg = response.message || "Error al eliminar los filtros";
        toast.error(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = "Error de conexión al eliminar los filtros";
      toast.error(errorMsg);
      console.error("Error deleting filters:", err);
      return false;
    }
  }, [refreshFilters]);

  return {
    filters,
    isLoading,
    error,
    refreshFilters,
    createFilter,
    updateFilter,
    toggleFilterStatus,
    deleteFilter,
    deleteBulk,
  };
}

