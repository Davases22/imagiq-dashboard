"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface PickupOrdersMetrics {
  totalPickPendingOrders: number;
  todayUpdatedOrders: number;
}

export function usePickupMetrics() {
  const [metrics, setMetrics] = useState<PickupOrdersMetrics>({
    totalPickPendingOrders: 0,
    todayUpdatedOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = (): string | null => {
    if (globalThis.window !== undefined) {
      return localStorage.getItem("imagiq_token");
    }
    return null;
  };

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      if (!token) {
        setError("No hay sesión activa");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/pickup-orders/metrics`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Cerrar sesión y redirigir a login
          localStorage.removeItem("imagiq_user");
          localStorage.removeItem("imagiq_token");
          globalThis.location.href = "/login";
          setError("Sesión expirada");
          return;
        }
        if (response.status === 403) {
          setError("Sin permisos para ver métricas");
          return;
        }
        throw new Error(`Error ${response.status}`);
      }

      const data: PickupOrdersMetrics = await response.json();
      setMetrics(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar métricas";
      setError(errorMessage);
      console.error("Error loading pickup metrics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: loadMetrics,
  };
}
