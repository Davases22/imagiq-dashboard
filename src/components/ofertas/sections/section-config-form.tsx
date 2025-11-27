import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ProductCardsLocalManager } from "@/components/product-cards/product-cards-local-manager"

interface ProductSection {
  id: string
  name: string
  products: string[]
}

interface SectionConfigFormProps {
  section: ProductSection
  onNameChange: (name: string) => void
}

export function SectionConfigForm({
  section,
  onNameChange,
}: SectionConfigFormProps) {
  return (
    <div className="space-y-4">
      {/* Nombre de la sección */}
      <div className="space-y-2">
        <Label htmlFor="sectionName">Nombre de la Sección</Label>
        <Input
          id="sectionName"
          value={section.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ej: Smartphones en oferta"
        />
      </div>

      <Separator />

      {/* Product Cards Manager Local */}
      <div className="space-y-2">
        <Label>Productos de esta sección</Label>
        <p className="text-xs text-muted-foreground mb-4">
          Crea tarjetas de productos personalizadas. Se guardarán al crear la oferta.
        </p>
        <ProductCardsLocalManager sectionId={section.id} />
      </div>
    </div>
  )
}
