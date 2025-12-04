"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Table2, BarChart3, Loader2 } from "lucide-react";
import { ApiOrder, OrderMetrics, StatusDistribution } from "@/types/orders";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: ApiOrder[];
  metrics: OrderMetrics | null;
  statusDistribution: StatusDistribution[];
}

/**
 * Formatea un número como moneda colombiana
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Traduce el estado de la orden al español
 */
const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    PENDING: "Pendiente",
    APPROVED: "Aprobada",
    CANCELLED: "Cancelada",
    REJECTED: "Rechazada",
    ABANDONED: "Abandonada",
    INTERNAL_ERROR: "Error Interno",
  };
  return translations[status] || status;
};

/**
 * Formatea una fecha de forma segura
 */
const safeFormatDate = (
  dateValue: string | Date | null | undefined
): string => {
  if (!dateValue) return "-";
  try {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  } catch {
    return "-";
  }
};

export function ExportDialog({
  open,
  onOpenChange,
  orders,
  metrics,
  statusDistribution,
}: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState<"orders" | "metrics" | null>(
    null
  );

  /**
   * Exporta las órdenes a Excel
   */
  const exportOrders = async () => {
    setIsExporting("orders");

    try {
      // Preparar datos para Excel
      const data = orders.map((order) => ({
        "# Orden": order.serial_id,
        Cliente: order.cliente || "-",
        Documento: order.numero_documento || "-",
        Total: formatCurrency(order.total_amount || 0),
        Estado: translateStatus(order.estado),
        "Medio de Pago": order.medio_pago || "-",
        "Info Pago": order.info_pago || "-",
        "Fecha Creación": safeFormatDate(order.fecha_creacion),
      }));

      // Crear workbook y worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();

      // Ajustar anchos de columna
      ws["!cols"] = [
        { wch: 10 }, // # Orden
        { wch: 30 }, // Cliente
        { wch: 15 }, // Documento
        { wch: 18 }, // Total
        { wch: 12 }, // Estado
        { wch: 12 }, // Medio de Pago
        { wch: 20 }, // Info Pago
        { wch: 18 }, // Fecha Creación
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Órdenes");

      // Generar nombre de archivo con fecha
      const fileName = `ordenes_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);

      // Cerrar diálogo después de un pequeño delay
      setTimeout(() => {
        setIsExporting(null);
        onOpenChange(false);
      }, 500);
    } catch (error) {
      console.error("Error al exportar órdenes:", error);
      setIsExporting(null);
    }
  };

  /**
   * Exporta las métricas a Excel
   */
  const exportMetrics = async () => {
    setIsExporting("metrics");

    try {
      const wb = XLSX.utils.book_new();

      // Hoja 1: Métricas Generales
      if (metrics) {
        const metricsData = [
          { Métrica: "Total de Órdenes", Valor: metrics.total_ordenes },
          {
            Métrica: "Ingresos Totales",
            Valor: formatCurrency(metrics.total_ingresos),
          },
          {
            Métrica: "Promedio por Orden",
            Valor: formatCurrency(metrics.promedio_ingreso),
          },
          {
            Métrica: "Tasa de Entrega",
            Valor: `${metrics.tasa_entrega_porcentaje.toFixed(1)}%`,
          },
          {
            Métrica: "Órdenes Pendientes",
            Valor: metrics.total_pendientes,
          },
          { Métrica: "Órdenes Aprobadas", Valor: metrics.total_aprobadas },
          { Métrica: "Órdenes en Reparto", Valor: metrics.total_en_reparto },
          { Métrica: "Órdenes Entregadas", Valor: metrics.total_entregadas },
          { Métrica: "Órdenes Canceladas", Valor: metrics.total_canceladas },
          {
            Métrica: "Recoger en Tienda",
            Valor: metrics.total_recoger_en_tienda,
          },
        ];

        const wsMetrics = XLSX.utils.json_to_sheet(metricsData);
        wsMetrics["!cols"] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsMetrics, "Métricas Generales");
      }

      // Hoja 2: Distribución por Estado
      if (statusDistribution.length > 0) {
        const distributionData = statusDistribution.map((item) => ({
          Estado: translateStatus(item.estado),
          Cantidad: item.cantidad,
        }));

        const wsDistribution = XLSX.utils.json_to_sheet(distributionData);
        wsDistribution["!cols"] = [{ wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(
          wb,
          wsDistribution,
          "Distribución Estados"
        );
      }

      // Generar nombre de archivo con fecha
      const fileName = `metricas_ordenes_${format(
        new Date(),
        "yyyy-MM-dd_HH-mm"
      )}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fileName);

      // Cerrar diálogo después de un pequeño delay
      setTimeout(() => {
        setIsExporting(null);
        onOpenChange(false);
      }, 500);
    } catch (error) {
      console.error("Error al exportar métricas:", error);
      setIsExporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar a Excel
          </DialogTitle>
          <DialogDescription>
            Selecciona qué datos deseas exportar
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {/* Opción: Exportar Órdenes */}
          <Button
            variant="outline"
            className="h-auto p-4 justify-start"
            onClick={exportOrders}
            disabled={isExporting !== null || orders.length === 0}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                {isExporting === "orders" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Table2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="text-left">
                <div className="font-medium">Tabla de Órdenes</div>
                <div className="text-sm text-muted-foreground">
                  Exporta {orders.length} órdenes con todos sus detalles
                </div>
              </div>
            </div>
          </Button>

          {/* Opción: Exportar Métricas */}
          <Button
            variant="outline"
            className="h-auto p-4 justify-start"
            onClick={exportMetrics}
            disabled={isExporting !== null || !metrics}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                {isExporting === "metrics" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                ) : (
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                )}
              </div>
              <div className="text-left">
                <div className="font-medium">Métricas y Estadísticas</div>
                <div className="text-sm text-muted-foreground">
                  Resumen de métricas y distribución por estado
                </div>
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
