import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { SectionListItem } from "./sections/section-list-item"
import { SectionConfigForm } from "./sections/section-config-form"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface ProductSection {
  id: string
  name: string
  products: string[]
}

interface OfertaSectionsManagerProps {
  title?: string
  description?: string
  onTitleChange?: (title: string) => void
  onDescriptionChange?: (description: string) => void
  sections: ProductSection[]
  onSectionsChange: (sections: ProductSection[]) => void
}

export function OfertaSectionsManager({
  title = "",
  description = "",
  onTitleChange,
  onDescriptionChange,
  sections,
  onSectionsChange,
}: OfertaSectionsManagerProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      onSectionsChange(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const handleAddSection = () => {
    const newSection: ProductSection = {
      id: `section-${Date.now()}`,
      name: `Sección ${sections.length + 1}`,
      products: [],
    }
    onSectionsChange([...sections, newSection])
    setActiveSection(newSection.id)
  }

  const handleDeleteSection = (sectionId: string) => {
    const updated = sections.filter((s) => s.id !== sectionId)
    onSectionsChange(updated)
    if (activeSection === sectionId && updated.length > 0) {
      setActiveSection(updated[0].id)
    }
  }

  const updateSection = (sectionId: string, updates: Partial<ProductSection>) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, ...updates } : s
    )
    onSectionsChange(updated)
  }

  const activeSectionData = sections.find((s) => s.id === activeSection)

  return (
    <div className="space-y-4">
      {/* Título y descripción general de la sección de productos */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="products-section-title">
            Título de la sección de productos (opcional)
          </Label>
          <Input
            id="products-section-title"
            placeholder="Ej: Productos en Oferta"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="products-section-description">
            Descripción de la sección (opcional)
          </Label>
          <Textarea
            id="products-section-description"
            placeholder="Ej: Aprovecha estos increíbles descuentos..."
            rows={3}
            value={description}
            onChange={(e) => onDescriptionChange?.(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sections.length} {sections.length === 1 ? "sección" : "secciones"} de productos
        </p>
        <Button type="button" onClick={handleAddSection} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Sección
        </Button>
      </div>

      {sections.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)} // Pass IDs, not objects
            strategy={verticalListSortingStrategy}
          >
            {/* Lista de secciones */}
            <div className="space-y-2">
              {sections.map((section) => (
                <SectionListItem
                  key={section.id}
                  section={section}
                  isActive={activeSection === section.id}
                  canDelete={sections.length > 1}
                  onSelect={() => setActiveSection(section.id)}
                  onDelete={() => handleDeleteSection(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {sections.length > 0 && (
        <>
          <Separator className="mt-4" />

          {/* Formulario de configuración */}
          {activeSectionData && (
            <SectionConfigForm
              section={activeSectionData}
              onNameChange={(name) => updateSection(activeSection, { name })}
            />
          )}
        </>
      )}
    </div>
  )
}
