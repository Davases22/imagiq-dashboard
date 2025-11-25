import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tag } from "lucide-react"

interface OfertaSummaryCardProps {
  descuento: string
  tipoDescuento: "porcentaje" | "monto"
  fechaInicio: string
  fechaFin: string
  bannersEnabled: boolean
  bannersCount: number
}

export function OfertaSummaryCard({
  descuento,
  tipoDescuento,
  fechaInicio,
  fechaFin,
  bannersEnabled,
  bannersCount,
}: OfertaSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Resumen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Descuento</p>
          <p className="font-medium">
            {descuento
              ? tipoDescuento === "porcentaje"
                ? `${descuento}%`
                : `$${descuento}`
              : "-"}
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-sm text-muted-foreground">Período</p>
          <p className="font-medium text-sm">
            {fechaInicio && fechaFin
              ? `${new Date(fechaInicio).toLocaleDateString("es-ES")} - ${new Date(fechaFin).toLocaleDateString("es-ES")}`
              : "-"}
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-sm text-muted-foreground">Banners</p>
          <p className="font-medium">
            {bannersEnabled ? `${bannersCount} banner${bannersCount > 1 ? "s" : ""}` : "Desactivados"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
