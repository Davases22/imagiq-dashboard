import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { SectionListItem } from "./sections/section-list-item"
import { SectionConfigForm } from "./sections/section-config-form"

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

interface OfertaSectionsManagerProps {
  sections: ProductSection[]
  onSectionsChange: (sections: ProductSection[]) => void
}

export function OfertaSectionsManager({
  sections,
  onSectionsChange,
}: OfertaSectionsManagerProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "")

  const handleAddSection = () => {
    const newSection: ProductSection = {
      id: `section-${Date.now()}`,
      name: `Sección ${sections.length + 1}`,
      type: "categoria",
      useBackgroundImage: false,
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

  const handleTypeChange = (type: ProductSection["type"]) => {
    updateSection(activeSection, {
      type,
      categoryId: undefined,
      menuId: undefined,
      submenuId: undefined,
    })
  }

  const handleCategoryChange = (categoryId: string) => {
    updateSection(activeSection, {
      categoryId,
      menuId: undefined,
      submenuId: undefined,
    })
  }

  const handleMenuChange = (menuId: string) => {
    updateSection(activeSection, { menuId, submenuId: undefined })
  }

  const activeSectionData = sections.find((s) => s.id === activeSection)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sections.length} {sections.length === 1 ? "sección" : "secciones"} de productos
        </p>
        <Button onClick={handleAddSection} size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Agregar Sección
        </Button>
      </div>

      {sections.length > 0 && (
        <>
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

          <Separator />

          {/* Formulario de configuración */}
          {activeSectionData && (
            <SectionConfigForm
              section={activeSectionData}
              onNameChange={(name) => updateSection(activeSection, { name })}
              onTypeChange={handleTypeChange}
              onCategoryChange={handleCategoryChange}
              onMenuChange={handleMenuChange}
              onSubmenuChange={(submenuId) => updateSection(activeSection, { submenuId })}
              onBackgroundToggle={(useBackgroundImage) =>
                updateSection(activeSection, { useBackgroundImage })
              }
              onBackgroundImageChange={(backgroundImage) =>
                updateSection(activeSection, { backgroundImage })
              }
              onProductsChange={(products) => updateSection(activeSection, { products })}
            />
          )}
        </>
      )}
    </div>
  )
}
