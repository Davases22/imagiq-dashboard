"use client";

import { useState, useEffect, useCallback } from "react";
import { getOrders } from "@/services/orders";
import {
  ApiOrder,
  OrdersApiResponse,
  OrdersPagination,
  OrdersQueryParams,
} from "@/types/orders";

interface UseOrdersState {
  orders: ApiOrder[];
  pagination: OrdersPagination | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseOrdersReturn extends UseOrdersState {
  refetch: () => Promise<void>;
  setParams: (params: Partial<OrdersQueryParams>) => void;
  params: OrdersQueryParams;
}

/**
 * Obtiene el token de autenticación del localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("imagiq_token");
}

/**
 * Hook para obtener órdenes con paginación y filtros
 *
 * @param initialParams - Parámetros iniciales de consulta
 * @returns Estado de las órdenes, paginación y funciones de control
 *
 * @example
 * const { orders, pagination, isLoading, error, refetch, setParams, params } = useOrders({
 *   page: 1,
 *   limit: 20,
 *   sortField: 'fecha_creacion',
 *   sortOrder: 'desc',
 * });
 */
export function useOrders(
  initialParams: OrdersQueryParams = {}
): UseOrdersReturn {
  const [params, setParamsState] = useState<OrdersQueryParams>({
    page: 1,
    limit: 20,
    sortField: "serial_id",
    sortOrder: "desc",
    ...initialParams,
  });

  const [state, setState] = useState<UseOrdersState>({
    orders: [],
    pagination: null,
    isLoading: true,
    error: null,
  });

  const fetchOrders = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const token = getAuthToken();
      const response: OrdersApiResponse = await getOrders(params, token);

      setState({
        orders: response.data,
        pagination: response.pagination,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Error al obtener órdenes");
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
    }
  }, [params]);

  // Fetch on mount and when params change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const setParams = useCallback((newParams: Partial<OrdersQueryParams>) => {
    setParamsState((prev) => ({
      ...prev,
      ...newParams,
      // Reset to page 1 when search or sort changes
      page:
        newParams.search !== undefined ||
        newParams.sortField !== undefined ||
        newParams.sortOrder !== undefined
          ? 1
          : newParams.page ?? prev.page,
    }));
  }, []);

  const refetch = useCallback(async () => {
    await fetchOrders();
  }, [fetchOrders]);

  return {
    ...state,
    refetch,
    setParams,
    params,
  };
}

/**
 * Hook simplificado que solo expone la función de fetch
 * Útil para casos donde se necesita control manual
 */
export function useOrdersFetch() {
  const fetchOrders = async (params: OrdersQueryParams = {}) => {
    const token = getAuthToken();
    return getOrders(params, token);
  };

  return { fetchOrders };
}
