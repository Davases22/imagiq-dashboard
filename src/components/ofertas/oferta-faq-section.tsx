import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"

interface FaqItem {
  id: string
  question: string
  answer: string
}

interface OfertaFaqSectionProps {
  enabled: boolean
  items: FaqItem[]
  onEnabledChange: (enabled: boolean) => void
  onItemsChange: (items: FaqItem[]) => void
}

export function OfertaFaqSection({
  enabled,
  items,
  onEnabledChange,
  onItemsChange,
}: OfertaFaqSectionProps) {
  const handleAddItem = () => {
    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      question: "",
      answer: "",
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preguntas Frecuentes (FAQ)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega preguntas y respuestas sobre la oferta
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          <Button type="button" onClick={handleAddItem} size="sm" variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Agregar Pregunta
          </Button>

          {items.length > 0 && (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Pregunta {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor={`question-${item.id}`}>Pregunta</Label>
                    <Input
                      id={`question-${item.id}`}
                      value={item.question}
                      onChange={(e) =>
                        handleItemChange(item.id, "question", e.target.value)
                      }
                      placeholder="Ej: ¿Cuándo termina la oferta?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`answer-${item.id}`}>Respuesta</Label>
                    <Textarea
                      id={`answer-${item.id}`}
                      value={item.answer}
                      onChange={(e) =>
                        handleItemChange(item.id, "answer", e.target.value)
                      }
                      placeholder="La oferta es válida hasta..."
                      rows={3}
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
