"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ApiOrder, ApiOrderStatus } from "@/types/orders";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LogOut,
  AlertOctagon,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ApiOrderStatusChartProps {
  orders: ApiOrder[];
  isLoading?: boolean;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
  icon: LucideIcon;
}

export function ApiOrderStatusChart({
  orders,
  isLoading,
}: ApiOrderStatusChartProps) {
  // Calcular distribución de estados
  const statusCounts: Record<ApiOrderStatus, number> = {
    PENDING: orders.filter((o) => o.estado === "PENDING").length,
    APPROVED: orders.filter((o) => o.estado === "APPROVED").length,
    CANCELLED: orders.filter((o) => o.estado === "CANCELLED").length,
    REJECTED: orders.filter((o) => o.estado === "REJECTED").length,
    ABANDONED: orders.filter((o) => o.estado === "ABANDONED").length,
    INTERNAL_ERROR: orders.filter((o) => o.estado === "INTERNAL_ERROR").length,
  };

  // Datos para el gráfico de barras
  const barData: StatusData[] = [
    {
      name: "Pendientes",
      value: statusCounts.PENDING,
      color: "hsl(var(--chart-1))",
      icon: Clock,
    },
    {
      name: "Aprobadas",
      value: statusCounts.APPROVED,
      color: "hsl(var(--chart-2))",
      icon: CheckCircle,
    },
    {
      name: "Rechazadas",
      value: statusCounts.REJECTED,
      color: "hsl(var(--chart-3))",
      icon: XCircle,
    },
    {
      name: "Canceladas",
      value: statusCounts.CANCELLED,
      color: "hsl(var(--chart-4))",
      icon: XCircle,
    },
    {
      name: "Abandonadas",
      value: statusCounts.ABANDONED,
      color: "hsl(var(--chart-5))",
      icon: LogOut,
    },
  ];

  // Solo mostrar errores internos si hay alguno
  if (statusCounts.INTERNAL_ERROR > 0) {
    barData.push({
      name: "Errores",
      value: statusCounts.INTERNAL_ERROR,
      color: "hsl(var(--destructive))",
      icon: AlertOctagon,
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = orders.length || 1;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {payload[0].payload.name}
              </span>
              <span className="text-sm font-bold">{payload[0].value}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {((payload[0].value / total) * 100).toFixed(1)}% del total
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Distribución por Estado</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="h-full w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Distribución por Estado</CardTitle>
        <CardDescription>
          Visualización de órdenes por estado actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda con iconos */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {barData.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="flex items-center gap-1.5">
                <Icon className="h-3 w-3" style={{ color: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium">({item.value})</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
