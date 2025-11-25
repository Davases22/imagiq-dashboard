import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OfertaBasicFieldsProps {
  titulo: string
  descripcion: string
  descuento: string
  tipoDescuento: "porcentaje" | "monto"
  fechaInicio: string
  fechaFin: string
  onFieldChange: (field: string, value: string) => void
}

export function OfertaBasicFields({
  titulo,
  descripcion,
  descuento,
  tipoDescuento,
  fechaInicio,
  fechaFin,
  onFieldChange,
}: OfertaBasicFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">
          Título de la Oferta <span className="text-destructive">*</span>
        </Label>
        <Input
          id="titulo"
          placeholder="Ej: Black Friday 2024"
          value={titulo}
          onChange={(e) => onFieldChange("titulo", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          placeholder="Descripción de la oferta (opcional)"
          value={descripcion}
          onChange={(e) => onFieldChange("descripcion", e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipoDescuento">
            Tipo de Descuento <span className="text-destructive">*</span>
          </Label>
          <Select
            value={tipoDescuento}
            onValueChange={(value) => onFieldChange("tipoDescuento", value)}
          >
            <SelectTrigger id="tipoDescuento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
              <SelectItem value="monto">Monto Fijo ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descuento">
            Descuento <span className="text-destructive">*</span>
          </Label>
          <Input
            id="descuento"
            type="number"
            min="0"
            step={tipoDescuento === "porcentaje" ? "1" : "0.01"}
            max={tipoDescuento === "porcentaje" ? "100" : undefined}
            placeholder={tipoDescuento === "porcentaje" ? "30" : "500"}
            value={descuento}
            onChange={(e) => onFieldChange("descuento", e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            {tipoDescuento === "porcentaje"
              ? "Porcentaje de descuento (0-100)"
              : "Monto fijo en pesos"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fechaInicio">
            Fecha de Inicio <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fechaInicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => onFieldChange("fechaInicio", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaFin">
            Fecha de Fin <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fechaFin"
            type="date"
            value={fechaFin}
            onChange={(e) => onFieldChange("fechaInicio", e.target.value)}
            min={fechaInicio}
            required
          />
        </div>
      </div>
    </div>
  )
}
