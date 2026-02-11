"use client";

import { useState, useEffect, useCallback } from "react";
import { formSubmissionEndpoints, pageEndpoints } from "@/lib/api";
import type { FormSubmission, FormSubmissionStats, SubmissionStatus, FormFieldDefinition } from "@/types/form-page";
import type { Page } from "@/types/page";
import { toast } from "sonner";

interface UseFormSubmissionsOptions {
  pageId: string;
}

export function useFormSubmissions({ pageId }: UseFormSubmissionsOptions) {
  // State
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [stats, setStats] = useState<FormSubmissionStats | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [formFields, setFormFields] = useState<FormFieldDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Load page data (form config for column headers)
  useEffect(() => {
    async function loadPage() {
      try {
        const res = await pageEndpoints.getById(pageId);
        const pageData = res.data?.data || res.data;
        setPage(pageData as Page);
        if ((pageData as any).form_config?.fields) {
          setFormFields((pageData as any).form_config.fields);
        }
      } catch (err) {
        console.error("Error loading page:", err);
      }
    }
    loadPage();
  }, [pageId]);

  // Load submissions
  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { page: currentPage, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      if (dateFrom) params.from_date = dateFrom;
      if (dateTo) params.to_date = dateTo;

      const res = await formSubmissionEndpoints.getByPage(pageId, params);
      const data = (res as any).data || res;
      setSubmissions(data.data || []);
      setTotal(data.meta?.total || 0);
      setTotalPages(data.meta?.totalPages || 0);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      toast.error("Error al cargar las respuestas");
    } finally {
      setIsLoading(false);
    }
  }, [pageId, currentPage, pageSize, statusFilter, searchTerm, dateFrom, dateTo]);

  // Load stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await formSubmissionEndpoints.getStats(pageId);
      setStats((res as any).data || res as any);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [pageId]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Actions
  const updateStatus = async (id: string, status: SubmissionStatus) => {
    try {
      await formSubmissionEndpoints.updateStatus(id, status);
      toast.success("Estado actualizado");
      fetchSubmissions();
      fetchStats();
    } catch (err) {
      toast.error("Error al actualizar estado");
    }
  };

  const bulkUpdateStatus = async (status: SubmissionStatus) => {
    if (selectedIds.size === 0) return;
    try {
      await formSubmissionEndpoints.bulkUpdateStatus(Array.from(selectedIds), status);
      toast.success(`${selectedIds.size} respuestas actualizadas`);
      setSelectedIds(new Set());
      fetchSubmissions();
      fetchStats();
    } catch (err) {
      toast.error("Error al actualizar");
    }
  };

  const deleteSubmission = async (id: string) => {
    try {
      await formSubmissionEndpoints.delete(id);
      toast.success("Respuesta eliminada");
      fetchSubmissions();
      fetchStats();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await formSubmissionEndpoints.bulkDelete(Array.from(selectedIds));
      toast.success(`${selectedIds.size} respuestas eliminadas`);
      setSelectedIds(new Set());
      fetchSubmissions();
      fetchStats();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const exportData = async (format: "csv" | "json") => {
    try {
      await formSubmissionEndpoints.exportData(pageId, format);
      toast.success(`Exportación ${format.toUpperCase()} iniciada`);
    } catch (err) {
      toast.error("Error al exportar");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submissions.map(s => s.id)));
    }
  };

  return {
    // Data
    submissions, stats, page, formFields, isLoading,
    // Pagination
    currentPage, pageSize, totalPages, total,
    setCurrentPage, setPageSize: (size: number) => { setPageSize(size); setCurrentPage(1); },
    // Filters
    statusFilter, searchTerm, dateFrom, dateTo,
    setStatusFilter: (s: SubmissionStatus | "") => { setStatusFilter(s); setCurrentPage(1); },
    setSearchTerm: (s: string) => { setSearchTerm(s); setCurrentPage(1); },
    setDateFrom: (s: string) => { setDateFrom(s); setCurrentPage(1); },
    setDateTo: (s: string) => { setDateTo(s); setCurrentPage(1); },
    // Selection
    selectedIds, toggleSelect, toggleSelectAll,
    // Actions
    updateStatus, bulkUpdateStatus, deleteSubmission, bulkDelete, exportData,
    refetch: fetchSubmissions,
  };
}
