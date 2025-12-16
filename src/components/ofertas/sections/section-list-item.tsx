import { Button } from "@/components/ui/button"
import { GripVertical, Trash2 } from "lucide-react"
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductSection {
  id: string
  name: string
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${isActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
        }`}
      onClick={onSelect}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-foreground">
        <GripVertical className="h-4 w-4 text-muted-foreground transition-colors" />
      </div>

      <div className="flex-1">
        <p className="font-medium text-sm">{section.name}</p>
        <p className="text-xs text-muted-foreground">
          {section.products.length} {section.products.length === 1 ? 'producto' : 'productos'}
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
