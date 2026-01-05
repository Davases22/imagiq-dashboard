"use client";

import { useState, useEffect, useCallback } from "react";
import { faqEndpoints } from "@/lib/api";
import { Faq, FaqPaginationData } from "@/types/faq";
import { toast } from "sonner";

interface UseFaqsResult {
  faqs: Faq[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  refetch: () => Promise<void>;
  deleteFaq: (id: string) => Promise<boolean>;
  stats: {
    total: number;
    activos: number;
    inactivos: number;
    sinRespuesta: number;
  };
}

interface UseFaqsOptions {
  page?: number;
  limit?: number;
  activo?: boolean;
  autoFetch?: boolean;
}

export function useFaqs(options: UseFaqsOptions = {}): UseFaqsResult {
  const {
    page: initialPage = 1,
    limit = 10,
    activo,
    autoFetch = true,
  } = options;

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 0,
    total: 0,
    limit,
  });
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    sinRespuesta: 0,
  });

  const fetchFaqs = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await faqEndpoints.getAll({ 
        page, 
        limit,
        activo 
      });

      if (response.success && response.data) {
        const paginationData: FaqPaginationData = response.data;

        setFaqs(paginationData.data || []);
        setPagination({
          currentPage: paginationData.meta.page,
          totalPages: paginationData.meta.totalPages,
          total: paginationData.meta.total,
          limit: paginationData.meta.limit,
        });

        // Calcular stats
        const activosCount = paginationData.data.filter(faq => faq.activo).length;
        const sinRespuestaCount = paginationData.data.filter(faq => faq.respuesta === 'sin respuesta').length;
        setStats({
          total: paginationData.meta.total,
          activos: activosCount,
          inactivos: paginationData.meta.total - activosCount,
          sinRespuesta: sinRespuestaCount,
        });
      } else {
        setError(response.message || "Error al cargar FAQs");
        setFaqs([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit, activo]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setCurrentPage(page);
  }, [pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pagination.totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const refetch = useCallback(async () => {
    await fetchFaqs(currentPage);
  }, [currentPage, fetchFaqs]);

  const deleteFaq = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await faqEndpoints.delete(id);
      
      if (response.success) {
        toast.success("FAQ eliminado exitosamente");
        await refetch();
        return true;
      } else {
        toast.error(response.message || "Error al eliminar FAQ");
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      toast.error(errorMessage);
      return false;
    }
  }, [refetch]);

  // Fetch FAQs when page changes
  useEffect(() => {
    if (autoFetch) {
      fetchFaqs(currentPage);
    }
  }, [currentPage, autoFetch, fetchFaqs]);

  return {
    faqs,
    isLoading,
    error,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    refetch,
    deleteFaq,
    stats,
  };
}
