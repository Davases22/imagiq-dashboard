"use client";

import { useState, useEffect } from "react";
import { bannerEndpoints } from "@/lib/api";

interface BannerStats {
  total: number;
  activos: number;
  inactivos: number;
}

interface UseBannerStatsResult {
  stats: BannerStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener estadísticas de banners
 * Obtiene el total de banners y cuántos están activos/inactivos
 */
export function useBannerStats(): UseBannerStatsResult {
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await bannerEndpoints.getStats();

      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || "Error al cargar estadísticas de banners");
        setStats(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
}
