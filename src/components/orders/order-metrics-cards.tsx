"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
  Store,
  XCircle,
} from "lucide-react";
import { OrderMetrics } from "@/types/orders";

interface OrderMetricsCardsProps {
  metrics: OrderMetrics | null;
  isLoading?: boolean;
}

/**
 * Skeleton para las tarjetas de métricas
 */
function MetricsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Formatea valores monetarios en COP
 */
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Componente de tarjetas de métricas de órdenes
 * Usa datos del endpoint /admin/orders/metrics
 */
export function OrderMetricsCards({
  metrics,
  isLoading,
}: OrderMetricsCardsProps) {
  if (isLoading || !metrics) {
    return <MetricsCardsSkeleton />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Órdenes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.total_ordenes.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.total_aprobadas.toLocaleString()} aprobadas
          </p>
        </CardContent>
      </Card>

      {/* Ingresos Totales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos Totales
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">
            {formatCurrency(metrics.total_ingresos)}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Promedio: {formatCurrency(metrics.promedio_ingreso)}
          </p>
        </CardContent>
      </Card>

      {/* Tasa de Entrega */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Entrega</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.tasa_entrega_porcentaje.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.total_entregadas.toLocaleString()} entregadas
          </p>
        </CardContent>
      </Card>

      {/* Pendientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.total_pendientes.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Por procesar</p>
        </CardContent>
      </Card>

      {/* En Reparto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Reparto</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.total_en_reparto.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">En camino</p>
        </CardContent>
      </Card>

      {/* Entregadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entregadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.total_entregadas.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Completadas</p>
        </CardContent>
      </Card>

      {/* Recoger en Tienda */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recoger Tienda</CardTitle>
          <Store className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.total_recoger_en_tienda.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Listas para recoger</p>
        </CardContent>
      </Card>

      {/* Canceladas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {metrics.total_canceladas.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Total canceladas</p>
        </CardContent>
      </Card>
    </div>
  );
}
