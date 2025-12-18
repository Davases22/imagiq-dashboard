"use client";

import { useCallback } from "react";
import { DynamicFilter, FilterOrderConfig } from "@/types/filters";
import { filterEndpoints } from "@/lib/api";
import { toast } from "sonner";

interface UpdateOrderParams {
  scopeType: "category" | "menu" | "submenu";
  scopeId: string;
  filterOrders: Array<{
    filterId: string;
    order: number;
  }>;
}

interface UseFilterOrderReturn {
  updateOrder: (params: UpdateOrderParams, onSuccess?: (updatedFilters: DynamicFilter[]) => void) => Promise<boolean>;
  updateFilterOrder: (filterId: string, order: FilterOrderConfig, onSuccess?: (updatedFilter: DynamicFilter) => void) => Promise<boolean>;
}

export function useFilterOrder(): UseFilterOrderReturn {
  // Update order for multiple filters in a scope (drag and drop)
  const updateOrder = useCallback(async (
    params: UpdateOrderParams,
    onSuccess?: (updatedFilters: DynamicFilter[]) => void
  ): Promise<boolean> => {
    try {
      // Validar que los parámetros estén completos
      if (!params.scopeType || !params.scopeId || !params.filterOrders || params.filterOrders.length === 0) {
        console.error("Invalid updateOrder params:", params);
        toast.error("Error: Parámetros inválidos para actualizar el orden");
        return false;
      }
      
      // Validar que todos los filterOrders tengan filterId y order
      const invalidOrders = params.filterOrders.filter(fo => !fo.filterId || typeof fo.order !== 'number');
      if (invalidOrders.length > 0) {
        console.error("Invalid filterOrders:", invalidOrders);
        toast.error("Error: Algunos filtros tienen datos inválidos");
        return false;
      }
      
      console.log("Calling updateOrder with params:", JSON.stringify(params, null, 2));
      const response = await filterEndpoints.updateOrder(params);
      
      if (response.success) {
        toast.success(response.message || "Orden actualizado correctamente");
        
        // If the API returns updated filters, call onSuccess with them
        // The response structure is: ApiResponse<{ success: boolean; message?: string; data?: { updatedFilters: ... } }>
        // So we need to access response.data.data?.updatedFilters
        const responseData = response.data as { success: boolean; message?: string; data?: { updatedFilters: Array<{ filterId: string; order: FilterOrderConfig }> } };
        if (responseData.data?.updatedFilters && onSuccess) {
          // Map the response to DynamicFilter format
          const updatedFilters = responseData.data.updatedFilters.map((item) => ({
            id: item.filterId,
            order: item.order,
          })) as Partial<DynamicFilter>[];
          
          // Note: The full filter data should come from the API response
          // For now, we'll just notify success and let the parent refresh
          if (onSuccess) {
            // The parent component should refresh filters after this
            onSuccess([] as DynamicFilter[]);
          }
        }
        
        return true;
      } else {
        const errorMsg = response.message || "Error al actualizar el orden";
        toast.error(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = "Error de conexión al actualizar el orden";
      toast.error(errorMsg);
      console.error("Error updating order:", err);
      return false;
    }
  }, []);

  // Update order for a single filter
  const updateFilterOrder = useCallback(async (
    filterId: string,
    order: FilterOrderConfig,
    onSuccess?: (updatedFilter: DynamicFilter) => void
  ): Promise<boolean> => {
    try {
      const response = await filterEndpoints.updateFilterOrder(filterId, order);
      
      if (response.success && response.data) {
        toast.success(response.message || "Orden actualizado correctamente");
        
        if (onSuccess) {
          // Convert date strings to Date objects
          const updatedFilter: DynamicFilter = {
            ...response.data,
            createdAt: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updatedAt: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date(),
          };
          onSuccess(updatedFilter);
        }
        
        return true;
      } else {
        const errorMsg = response.message || "Error al actualizar el orden";
        toast.error(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = "Error de conexión al actualizar el orden";
      toast.error(errorMsg);
      console.error("Error updating filter order:", err);
      return false;
    }
  }, []);

  return {
    updateOrder,
    updateFilterOrder,
  };
}

