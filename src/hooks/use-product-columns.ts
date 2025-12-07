"use client";

import { useState, useEffect } from "react";
import { ProductColumn } from "@/types/filters";
import { productEndpoints } from "@/lib/api";
import { toast } from "sonner";

interface UseProductColumnsReturn {
  columns: ProductColumn[];
  isLoading: boolean;
  error: string | null;
}

export function useProductColumns(): UseProductColumnsReturn {
  const [columns, setColumns] = useState<ProductColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await productEndpoints.getColumnNames();
        
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          // Process columns to enable dynamic values for "unidad" column
          const processedColumns = response.data.map((column: ProductColumn) => {
            // Enable dynamic values for "unidad" column (case-insensitive match)
            if (column.key.toLowerCase() === "unidad" || column.key.toLowerCase() === "unidades") {
              return {
                ...column,
                supportsDynamic: true,
              };
            }
            return column;
          });
          setColumns(processedColumns);
        } else {
          const errorMsg = "Error al cargar las columnas desde la API.";
          setError(errorMsg);
          console.error("Failed to fetch column names from API");
          toast.error(errorMsg);
        }
      } catch (err) {
        const errorMsg = "Error al cargar las columnas. Por favor, recarga la página.";
        setError(errorMsg);
        console.error("Error fetching column names:", err);
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchColumns();
  }, []);

  return { columns, isLoading, error };
}

