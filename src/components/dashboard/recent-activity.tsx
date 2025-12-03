import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Orden } from "@/types/dasboard";

interface RecentActivityProps {
  activities: Orden[];
}

export function RecentActivity({ activities }: Readonly<RecentActivityProps>) {
  const translateStatus = (estado: string): string => {
    const statusLower = estado.toLowerCase();
    const translations: Record<string, string> = {
      approved: "Aprobado",
      pending: "Pendiente",
      cancelled: "Cancelado",
      delivered: "Entregado",
      shipped: "Enviado",
      processing: "Procesando",
      refunded: "Reembolsado",
      completed: "Completado",
      failed: "Fallido",
      on_hold: "En espera",
    };
    return translations[statusLower] ?? estado;
  };

  const getStatusColor = (estado: string) => {
    const statusLower = estado.toLowerCase();
    if (
      statusLower === "approved" ||
      statusLower === "delivered" ||
      statusLower === "completed"
    )
      return "bg-green-100 text-green-800";
    if (statusLower === "pending" || statusLower === "processing")
      return "bg-yellow-100 text-yellow-800";
    if (statusLower === "cancelled" || statusLower === "failed")
      return "bg-red-100 text-red-800";
    if (statusLower === "shipped") return "bg-blue-100 text-blue-800";
    if (statusLower === "refunded" || statusLower === "on_hold")
      return "bg-orange-100 text-orange-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((orden) => (
            <div
              key={orden.serial_id}
              className="flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(orden.estado)}>
                    {translateStatus(orden.estado)}
                  </Badge>
                  <span className="text-sm font-medium">
                    #{orden.serial_id}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{orden.cliente}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {Intl.NumberFormat("es-CO", {
                    currency: "COP",
                    style: "currency",
                    maximumFractionDigits: 0,
                  }).format(orden.total_amount)}
                </p>
                <p className="text-xs text-muted-foreground">{orden.age}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
