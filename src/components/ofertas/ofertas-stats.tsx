import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag, Calendar } from "lucide-react"

interface Oferta {
  id: string
  titulo: string
  descripcion?: string
  descuento: number
  tipoDescuento: "porcentaje" | "monto"
  fechaInicio: string
  fechaFin: string
  isActive: boolean
  categorias?: string[]
  productos?: string[]
  createdAt: string
  updatedAt: string
}

interface OfertasStatsProps {
  ofertas: Oferta[]
}

export function OfertasStats({ ofertas }: OfertasStatsProps) {
  const isOfertaVigente = (oferta: Oferta) => {
    const now = new Date()
    const inicio = new Date(oferta.fechaInicio)
    const fin = new Date(oferta.fechaFin)
    return now >= inicio && now <= fin
  }

  const ofertasActivas = ofertas.filter(o => o.isActive).length
  const ofertasVigentes = ofertas.filter(o => isOfertaVigente(o) && o.isActive).length

  const ofertasPorcentaje = ofertas.filter(o => o.tipoDescuento === "porcentaje")
  const descuentoPromedio = ofertasPorcentaje.length > 0
    ? Math.round(ofertasPorcentaje.reduce((acc, o) => acc + o.descuento, 0) / ofertasPorcentaje.length)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Ofertas</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ofertas.length}</div>
          <p className="text-xs text-muted-foreground">{ofertasActivas} activas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ofertas Vigentes</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ofertasVigentes}</div>
          <p className="text-xs text-muted-foreground">En período válido</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Descuento Promedio</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{descuentoPromedio}%</div>
          <p className="text-xs text-muted-foreground">En ofertas de porcentaje</p>
        </CardContent>
      </Card>
    </div>
  )
}
