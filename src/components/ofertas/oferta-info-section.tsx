import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Image as ImageIcon } from "lucide-react"

interface InfoItem {
  id: string
  title: string
  image?: File | string
  linkUrl: string
}

interface OfertaInfoSectionProps {
  enabled: boolean
  items: InfoItem[]
  onEnabledChange: (enabled: boolean) => void
  onItemsChange: (items: InfoItem[]) => void
}

export function OfertaInfoSection({
  enabled,
  items,
  onEnabledChange,
  onItemsChange,
}: OfertaInfoSectionProps) {
  const handleAddItem = () => {
    const newItem: InfoItem = {
      id: `info-${Date.now()}`,
      title: "",
      linkUrl: "",
    }
    onItemsChange([...items, newItem])
  }

  const handleDeleteItem = (itemId: string) => {
    onItemsChange(items.filter((i) => i.id !== itemId))
  }

  const handleItemChange = (itemId: string, field: string, value: string) => {
    const updated = items.map((i) =>
      i.id === itemId ? { ...i, [field]: value } : i
    )
    onItemsChange(updated)
  }

  const handleImageChange = (itemId: string, file: File | undefined) => {
    const updated = items.map((i) =>
      i.id === itemId ? { ...i, image: file } : i
    )
    onItemsChange(updated)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sección Informativa</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega bloques informativos con imagen y enlace
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          <Button onClick={handleAddItem} size="sm" variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Bloque Informativo
          </Button>

          {items.length > 0 && (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Bloque {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor={`title-${item.id}`}>Título</Label>
                    <Input
                      id={`title-${item.id}`}
                      value={item.title}
                      onChange={(e) =>
                        handleItemChange(item.id, "title", e.target.value)
                      }
                      placeholder="Ej: Envío gratis en compras mayores a $100.000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`image-${item.id}`}>Imagen</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`image-${item.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageChange(item.id, e.target.files?.[0])
                        }
                      />
                      {item.image && (
                        <ImageIcon className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`link-${item.id}`}>URL de Destino</Label>
                    <Input
                      id={`link-${item.id}`}
                      value={item.linkUrl}
                      onChange={(e) =>
                        handleItemChange(item.id, "linkUrl", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
