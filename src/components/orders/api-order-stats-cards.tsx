"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, TrendingUp, Clock } from "lucide-react";
import { ApiOrder, ApiOrderStatus } from "@/types/orders";

interface ApiOrderStatsCardsProps {
  orders: ApiOrder[];
  isLoading?: boolean;
}

export function ApiOrderStatsCards({
  orders,
  isLoading,
}: ApiOrderStatsCardsProps) {
  // Calcular métricas
  const activeOrders = orders.filter(
    (o) => o.estado !== "CANCELLED" && o.estado !== "REJECTED"
  );
  const totalRevenue = activeOrders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );
  const avgOrderValue =
    activeOrders.length > 0 ? totalRevenue / activeOrders.length : 0;

  const pendingCount = orders.filter((o) => o.estado === "PENDING").length;
  const approvedCount = orders.filter((o) => o.estado === "APPROVED").length;

  // Calcular tasa de aprobación
  const approvalRate =
    orders.length > 0
      ? ((approvedCount / orders.length) * 100).toFixed(1)
      : "0";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
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

  return (
    <div className="flex flex-col gap-4">
      {/* Total de Órdenes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{orders.length}</div>
          <p className="text-xs text-muted-foreground">
            {activeOrders.length} activas
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
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Promedio: {formatCurrency(avgOrderValue)}
          </p>
        </CardContent>
      </Card>

      {/* Tasa de Aprobación */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tasa de Aprobación
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvalRate}%</div>
          <p className="text-xs text-muted-foreground">
            {approvedCount} aprobadas
          </p>
        </CardContent>
      </Card>

      {/* Órdenes Pendientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">Por procesar</p>
        </CardContent>
      </Card>
    </div>
  );
}
