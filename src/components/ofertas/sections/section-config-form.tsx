import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { SectionTypeSelectors } from "./section-type-selectors"
import { ProductCardsManager } from "@/components/product-cards/product-cards-manager"

interface ProductSection {
  id: string
  name: string
  type: "categoria" | "menu" | "submenu"
  categoryId?: string
  menuId?: string
  submenuId?: string
  useBackgroundImage: boolean
  backgroundImage?: File | string
  products: string[]
}

interface SectionConfigFormProps {
  section: ProductSection
  onNameChange: (name: string) => void
  onTypeChange: (type: ProductSection["type"]) => void
  onCategoryChange: (categoryId: string) => void
  onMenuChange: (menuId: string) => void
  onSubmenuChange: (submenuId: string) => void
  onBackgroundToggle: (enabled: boolean) => void
  onBackgroundImageChange: (file: File | undefined) => void
}

export function SectionConfigForm({
  section,
  onNameChange,
  onTypeChange,
  onCategoryChange,
  onMenuChange,
  onSubmenuChange,
  onBackgroundToggle,
  onBackgroundImageChange,
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

      {/* Tipo de sección */}
      <div className="space-y-2">
        <Label htmlFor="sectionType">Tipo de Sección</Label>
        <Select value={section.type} onValueChange={(value) => onTypeChange(value as ProductSection["type"])}>
          <SelectTrigger id="sectionType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="categoria">Categoría</SelectItem>
            <SelectItem value="menu">Menú</SelectItem>
            <SelectItem value="submenu">Submenú</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Define el nivel de productos que mostrarás en esta sección
        </p>
      </div>

      {/* Selectores de categoría/menú/submenú */}
      <SectionTypeSelectors
        type={section.type}
        categoryId={section.categoryId}
        menuId={section.menuId}
        submenuId={section.submenuId}
        onCategoryChange={onCategoryChange}
        onMenuChange={onMenuChange}
        onSubmenuChange={onSubmenuChange}
      />

      <Separator />

      {/* Product Cards Manager */}
      <div className="space-y-2">
        <Label>Productos de esta sección</Label>
        <p className="text-xs text-muted-foreground mb-4">
          Crea tarjetas de productos personalizadas con imágenes, títulos y descripciones
        </p>
        <ProductCardsManager />
      </div>

      <Separator />

      {/* Imagen de fondo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="useBackgroundImage">Imagen de Fondo en Cards</Label>
            <p className="text-xs text-muted-foreground">
              Agrega una imagen de fondo personalizada a las tarjetas de productos
            </p>
          </div>
          <Switch
            id="useBackgroundImage"
            checked={section.useBackgroundImage}
            onCheckedChange={onBackgroundToggle}
          />
        </div>

        {section.useBackgroundImage && (
          <div className="space-y-2">
            <Label htmlFor="backgroundImage">Imagen de Fondo</Label>
            <Input
              id="backgroundImage"
              type="file"
              accept="image/*"
              onChange={(e) => onBackgroundImageChange(e.target.files?.[0])}
            />
            {section.backgroundImage && (
              <p className="text-xs text-muted-foreground">✓ Imagen seleccionada</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
