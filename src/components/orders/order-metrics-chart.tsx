"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatusDistribution } from "@/types/orders";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  AlertOctagon,
  Ban,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface OrderMetricsChartProps {
  statusDistribution: StatusDistribution[];
  isLoading?: boolean;
}

/**
 * Configuración de colores e iconos por estado
 */
const statusConfig: Record<
  string,
  { color: string; label: string; icon: LucideIcon }
> = {
  PENDING: {
    color: "#f59e0b", // amber-500
    label: "Pendientes",
    icon: Clock,
  },
  APPROVED: {
    color: "#22c55e", // green-500
    label: "Aprobadas",
    icon: CheckCircle,
  },
  CANCELLED: {
    color: "#ef4444", // red-500
    label: "Canceladas",
    icon: XCircle,
  },
  REJECTED: {
    color: "#f97316", // orange-500
    label: "Rechazadas",
    icon: Ban,
  },
  ABANDONED: {
    color: "#6b7280", // gray-500
    label: "Abandonadas",
    icon: LogOut,
  },
  INTERNAL_ERROR: {
    color: "#dc2626", // red-600
    label: "Errores",
    icon: AlertOctagon,
  },
};

/**
 * Tooltip personalizado para los gráficos
 */
function CustomTooltip({ active, payload, total }: any) {
  if (active && payload?.length) {
    const data = payload[0].payload;
    const percentage =
      total > 0 ? ((data.cantidad / total) * 100).toFixed(1) : 0;

    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{data.label}</span>
            <span className="text-sm font-bold">{data.cantidad}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {percentage}% del total
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Gráfico de distribución de estados de órdenes
 * Usa datos del endpoint /admin/orders/metrics
 */
export function OrderMetricsChart({
  statusDistribution,
  isLoading,
}: OrderMetricsChartProps) {
  // Preparar datos para el gráfico
  const chartData = statusDistribution.map((item) => ({
    ...item,
    label: statusConfig[item.estado]?.label || item.estado,
    color: statusConfig[item.estado]?.color || "hsl(var(--muted))",
  }));

  const total = statusDistribution.reduce(
    (sum, item) => sum + item.cantidad,
    0
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Distribución por Estado</CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <div className="h-full w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Distribución por Estado</CardTitle>
          <CardDescription>No hay datos disponibles</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos para mostrar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Distribución por Estado</CardTitle>
        <CardDescription>
          Total: {total.toLocaleString()} órdenes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Gráfico de barras */}
          <div className="w-full md:flex-1 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 0, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={80}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip total={total} />} />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${entry.estado}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de pie */}
          <div className="w-[160px] h-[160px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="cantidad"
                  nameKey="label"
                >
                  {chartData.map((entry) => (
                    <Cell key={`pie-${entry.estado}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip total={total} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leyenda con iconos */}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {chartData.map((item) => {
            const config = statusConfig[item.estado];
            const Icon = config?.icon || Clock;

            return (
              <div key={item.estado} className="flex items-center gap-1.5">
                <Icon className="h-3 w-3" style={{ color: item.color }} />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">
                  ({item.cantidad.toLocaleString()})
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
