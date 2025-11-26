import { Button } from "@/components/ui/button"
import { GripVertical, Trash2 } from "lucide-react"

interface ProductSection {
  id: string
  name: string
  type: "categoria" | "menu" | "submenu"
  products: string[]
}

interface SectionListItemProps {
  section: ProductSection
  isActive: boolean
  canDelete: boolean
  onSelect: () => void
  onDelete: () => void
}

export function SectionListItem({
  section,
  isActive,
  canDelete,
  onSelect,
  onDelete,
}: SectionListItemProps) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
        isActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onSelect}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-medium text-sm">{section.name}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {section.type} • {section.products.length} productos
        </p>
      </div>
      {canDelete && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  )
}
