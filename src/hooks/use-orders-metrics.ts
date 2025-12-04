"use client";

import { useState, useEffect, useCallback } from "react";
import { getOrdersMetrics } from "@/services/orders";
import {
  OrderMetrics,
  OrdersMetricsResponse,
  StatusDistribution,
} from "@/types/orders";

interface UseOrdersMetricsState {
  metrics: OrderMetrics | null;
  statusDistribution: StatusDistribution[];
  isLoading: boolean;
  error: Error | null;
}

interface UseOrdersMetricsReturn extends UseOrdersMetricsState {
  refetch: () => Promise<void>;
}

/**
 * Obtiene el token de autenticación del localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("imagiq_token");
}

/**
 * Hook para obtener métricas de órdenes
 *
 * @returns Estado de las métricas, distribución de estados y funciones de control
 *
 * @example
 * const { metrics, statusDistribution, isLoading, error, refetch } = useOrdersMetrics();
 * if (metrics) {
 *   console.log(metrics.total_ordenes, metrics.total_ingresos);
 * }
 */
export function useOrdersMetrics(): UseOrdersMetricsReturn {
  const [state, setState] = useState<UseOrdersMetricsState>({
    metrics: null,
    statusDistribution: [],
    isLoading: true,
    error: null,
  });

  const fetchMetrics = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const token = getAuthToken();
      const response: OrdersMetricsResponse = await getOrdersMetrics(token);

      setState({
        metrics: response.metrics,
        statusDistribution: response.statusDistribution,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Error al obtener métricas");
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refetch = useCallback(async () => {
    await fetchMetrics();
  }, [fetchMetrics]);

  return {
    ...state,
    refetch,
  };
}
