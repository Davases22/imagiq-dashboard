"use client";
import { CategoryChart } from "@/components/charts/category-chart";
import { OverviewChart } from "@/components/charts/overview-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { BrandIcon } from "@/components/icons/BrandIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import {
  mockCategoryData,
  mockDashboardMetrics,
  mockPaymentMethodData,
  mockTopProducts,
} from "@/lib/mock-data";
import { DashboardMetrics } from "@/types/dasboard";
import {
  CreditCard,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function InicioPage() {
  const { getMetrics } = useDashboardMetrics();
  const [metrics, setMetrics] = useState<DashboardMetrics>();

  useEffect(() => {
    async function fetchMetrics() {
      const data = await getMetrics();
      setMetrics(data);
    }
    fetchMetrics();
  }, []);
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Vista general de tu e-commerce</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ventas Totales"
          value={`${Intl.NumberFormat("es-CO", {
            currency: "COP",
            style: "currency",
            maximumFractionDigits: 0,
          }).format(metrics?.sales.current_sales ?? 0)}`}
          description="Total de ingresos este mes"
          icon={DollarSign}
          trend={{
            value: Number(metrics?.sales?.percent_difference ?? 0),
            label: "desde el mes pasado",
          }}
        />
        <MetricCard
          title="Órdenes"
          value={metrics?.sales.current_count ?? 0}
          description="Órdenes procesadas este mes"
          icon={ShoppingCart}
          trend={{
            value: Number(metrics?.sales?.percent_difference ?? 0),
            label: "desde el mes pasado",
          }}
        />
        <MetricCard
          title="Clientes"
          value={metrics?.newUsers.current_count ?? 0}
          description="Total de clientes registrados"
          icon={Users}
        />
        <MetricCard
          title="Tasa de Conversión"
          value={`${mockDashboardMetrics.conversionRate}%`}
          description="Porcentaje de conversión de visitas a ventas"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Sales Overview Chart */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart data={metrics?.monthlySales ?? []} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1 lg:col-span-3">
          <RecentActivity activities={metrics?.ordenes ?? []} />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Category Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={mockCategoryData} />
            <div className="mt-4 space-y-2">
              {mockCategoryData.map((category, index) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: [
                          "hsl(142, 76%, 36%)", // Verde principal
                          "hsl(120, 60%, 50%)", // Verde claro
                          "hsl(160, 70%, 40%)", // Verde azulado
                          "hsl(100, 65%, 45%)", // Verde amarillento
                          "hsl(180, 55%, 45%)", // Verde agua
                          "hsl(var(--muted-foreground))", // Fallback
                        ][index % 6],
                      }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{category.value}%</p>
                    <p className="text-xs text-muted-foreground">
                      ${category.sales.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.topProducts.map((product, index) => (
                <div
                  key={product.desdetallada}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {product.desdetallada}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.total_vendidos} ventas
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {Intl.NumberFormat("es-CO", {
                      currency: "COP",
                      style: "currency",
                      maximumFractionDigits: 0,
                    }).format(product.ingresos_generados)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.paymentMethods.map((method) => (
                <div
                  key={method.nombre}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <BrandIcon
                      brand={method.nombre}
                      size={20}
                      className="text-muted-foreground"
                    />
                    <div>
                      <p className="text-sm font-medium">{method.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.percent}% del total
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {Intl.NumberFormat("es-CO", {
                      currency: "COP",
                      style: "currency",
                      maximumFractionDigits: 0,
                    }).format(method.valor_vendido)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
