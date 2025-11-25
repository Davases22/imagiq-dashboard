import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"

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

interface OfertasTableProps {
  ofertas: Oferta[]
  onToggleActive: (oferta: Oferta) => void
  onEdit: (id: string) => void
  onDelete: (oferta: Oferta) => void
}

export function OfertasTable({ ofertas, onToggleActive, onEdit, onDelete }: OfertasTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getVigenciaStatus = (oferta: Oferta) => {
    const now = new Date()
    const inicio = new Date(oferta.fechaInicio)
    const fin = new Date(oferta.fechaFin)

    if (now >= inicio && now <= fin) {
      return { label: "Vigente", variant: "default" as const, className: "bg-green-600" }
    }
    if (now < inicio) {
      return { label: "Próxima", variant: "outline" as const, className: "" }
    }
    return { label: "Expirada", variant: "secondary" as const, className: "" }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Descuento</TableHead>
          <TableHead>Período</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Vigencia</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ofertas.map((oferta) => {
          const vigencia = getVigenciaStatus(oferta)
          return (
            <TableRow key={oferta.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{oferta.titulo}</div>
                  {oferta.descripcion && (
                    <div className="text-sm text-muted-foreground">
                      {oferta.descripcion}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {oferta.tipoDescuento === "porcentaje"
                    ? `${oferta.descuento}%`
                    : `$${oferta.descuento}`}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{formatDate(oferta.fechaInicio)}</div>
                  <div className="text-muted-foreground">
                    {formatDate(oferta.fechaFin)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={oferta.isActive}
                    onCheckedChange={() => onToggleActive(oferta)}
                  />
                  {oferta.isActive ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={vigencia.variant} className={vigencia.className}>
                  {vigencia.label}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(oferta.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(oferta)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
