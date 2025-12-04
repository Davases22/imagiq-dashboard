"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { apiOrdersColumns } from "@/components/tables/columns/api-orders-columns";
import { OrderMetricsCards } from "@/components/orders/order-metrics-cards";
import { OrderMetricsChart } from "@/components/orders/order-metrics-chart";
import { ExportDialog } from "@/components/orders/export-dialog";
import { useOrders } from "@/hooks/use-orders";
import { useOrdersMetrics } from "@/hooks/use-orders-metrics";
import { ApiOrderStatus, OrderSortField, SortOrder } from "@/types/orders";
import {
  Download,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OrdenesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApiOrderStatus | "all">(
    "all"
  );
  const [activeTab, setActiveTab] = useState<string>("all");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Hook para obtener órdenes de la API
  const { orders, pagination, isLoading, error, refetch, setParams, params } =
    useOrders({
      page: 1,
      limit: 20,
      sortField: "serial_id",
      sortOrder: "desc",
    });

  // Hook para obtener métricas de órdenes
  const {
    metrics,
    statusDistribution,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useOrdersMetrics();

  // Filtrar órdenes localmente basado en tab y filtros
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filtro de estado desde select
      const matchesStatus =
        statusFilter === "all" || order.estado === statusFilter;

      // Filtro de pestaña activa
      let matchesTab = true;
      switch (activeTab) {
        case "pending":
          matchesTab = order.estado === "PENDING";
          break;
        case "approved":
          matchesTab = order.estado === "APPROVED";
          break;
        case "cancelled":
          matchesTab =
            order.estado === "CANCELLED" || order.estado === "REJECTED";
          break;
        case "abandoned":
          matchesTab = order.estado === "ABANDONED";
          break;
        default:
          matchesTab = true;
      }

      return matchesStatus && matchesTab;
    });
  }, [orders, statusFilter, activeTab]);

  // Calcular contadores para las pestañas
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.estado === "PENDING").length,
      approved: orders.filter((o) => o.estado === "APPROVED").length,
      cancelled: orders.filter(
        (o) => o.estado === "CANCELLED" || o.estado === "REJECTED"
      ).length,
      abandoned: orders.filter((o) => o.estado === "ABANDONED").length,
    };
  }, [orders]);

  // Configuración de filtros para la tabla
  const tableFilters = [
    {
      id: "estado",
      title: "Estado",
      options: [
        { label: "Pendiente", value: "PENDING" },
        { label: "Aprobada", value: "APPROVED" },
        { label: "Cancelada", value: "CANCELLED" },
        { label: "Rechazada", value: "REJECTED" },
        { label: "Abandonada", value: "ABANDONED" },
        { label: "Error Interno", value: "INTERNAL_ERROR" },
      ],
    },
    {
      id: "medio_pago",
      title: "Medio de Pago",
      options: [
        { label: "Tarjeta", value: "Tarjeta" },
        { label: "PSE", value: "PSE" },
        { label: "Addi", value: "Addi" },
      ],
    },
  ];

  // Debounce para la búsqueda - espera 500ms después de dejar de escribir
  useEffect(() => {
    // No ejecutar en el mount inicial
    if (searchQuery === "" && debouncedSearch === "") return;
    // Si ya está sincronizado, no hacer nada
    if (searchQuery === debouncedSearch) return;

    const timeoutId = setTimeout(() => {
      console.log("Debounce completado, buscando:", searchQuery);
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, debouncedSearch]);

  // Efecto separado para llamar a la API cuando cambia el debounced search
  useEffect(() => {
    // Evitar la llamada inicial cuando ambos están vacíos
    if (debouncedSearch === "" && params.search === undefined) return;

    console.log("Llamando API con search:", debouncedSearch || "(vacío)");
    setParams({ search: debouncedSearch || undefined });
  }, [debouncedSearch, setParams, params.search]);

  // Handler para cambio de paginación
  const handlePaginationChange = useCallback(
    ({ pageIndex, pageSize }: { pageIndex: number; pageSize: number }) => {
      setParams({
        page: pageIndex + 1, // API usa 1-indexed
        limit: pageSize,
      });
    },
    [setParams]
  );

  const handleExportOrders = () => {
    setExportDialogOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    refetchMetrics();
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Órdenes
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y monitorea todas tus órdenes en tiempo real
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={handleRefresh}
            size="sm"
            className="sm:h-10"
            disabled={isLoading || metricsLoading}
          >
            <RefreshCw
              className={`h-4 w-4 sm:mr-2 ${
                isLoading || metricsLoading ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Refrescar</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleExportOrders}
            size="sm"
            className="sm:h-10"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {(error || metricsError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar datos</AlertTitle>
          <AlertDescription>
            {error?.message || metricsError?.message}. Por favor intenta
            refrescar la página.
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <OrderMetricsCards metrics={metrics} isLoading={metricsLoading} />

      {/* Status Distribution Chart */}
      <OrderMetricsChart
        statusDistribution={statusDistribution}
        isLoading={metricsLoading}
      />

      {/* Filters Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por orden, cliente, documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    // Ejecutar búsqueda inmediata al presionar Enter
                    setDebouncedSearch(searchQuery);
                  }
                }}
                className="pl-9 pr-9"
              />
              {searchQuery !== debouncedSearch && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ApiOrderStatus | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="APPROVED">Aprobada</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
                <SelectItem value="REJECTED">Rechazada</SelectItem>
                <SelectItem value="ABANDONED">Abandonada</SelectItem>
                <SelectItem value="INTERNAL_ERROR">Error Interno</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={params.sortField || "serial_id"}
              onValueChange={(value) =>
                setParams({ sortField: value as OrderSortField })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serial_id">Número de orden</SelectItem>
                <SelectItem value="fecha_creacion">
                  Fecha de creación
                </SelectItem>
                <SelectItem value="total_amount">Monto total</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="estado">Estado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={params.sortOrder || "desc"}
              onValueChange={(value) =>
                setParams({ sortOrder: value as SortOrder })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Dirección" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Más recientes primero</SelectItem>
                <SelectItem value="asc">Más antiguos primero</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs with Orders Table */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-3"
      >
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-auto">
            <TabsTrigger value="all" className="whitespace-nowrap">
              Todas
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
                {tabCounts.all}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="whitespace-nowrap">
              Pendientes
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
                {tabCounts.pending}
              </span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="whitespace-nowrap">
              Aprobadas
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
                {tabCounts.approved}
              </span>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="whitespace-nowrap">
              Canceladas
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
                {tabCounts.cancelled}
              </span>
            </TabsTrigger>
            <TabsTrigger value="abandoned" className="whitespace-nowrap">
              Abandonadas
              <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
                {tabCounts.abandoned}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && "Todas las órdenes"}
                {activeTab === "pending" && "Órdenes pendientes"}
                {activeTab === "approved" && "Órdenes aprobadas"}
                {activeTab === "cancelled" && "Órdenes canceladas/rechazadas"}
                {activeTab === "abandoned" && "Órdenes abandonadas"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={apiOrdersColumns}
                data={filteredOrders}
                searchKey="cliente"
                filters={tableFilters}
                loading={isLoading}
                pageCount={pagination?.totalPages}
                pageIndex={(params.page || 1) - 1}
                pageSize={params.limit || 20}
                totalItems={pagination?.total}
                onPaginationChange={handlePaginationChange}
                initialColumnVisibility={{
                  fecha_creacion: false,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination Info */}
      {pagination && (
        <div className="text-sm text-muted-foreground text-center">
          Mostrando página {pagination.page} de {pagination.totalPages} (
          {pagination.total} órdenes en total)
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        orders={filteredOrders}
        metrics={metrics}
        statusDistribution={statusDistribution}
      />
    </div>
  );
}
