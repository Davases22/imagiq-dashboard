"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { tiendasEndpoints, BackendTienda } from "@/lib/api";

export function useTiendas() {
  const [tiendas, setTiendas] = useState<BackendTienda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTiendas = async () => {
    try {
      const response = await tiendasEndpoints.getAll();

      if (response.success && response.data) {
        const backendTiendas = Array.isArray(response.data) ? response.data : [];
        setTiendas(backendTiendas);
      } else {
        toast.error("Error al cargar tiendas");
      }
    } catch (error) {
      toast.error("Error al cargar tiendas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTiendas();
  }, []);

  return {
    tiendas,
    isLoading,
    reloadTiendas: loadTiendas,
  };
}
