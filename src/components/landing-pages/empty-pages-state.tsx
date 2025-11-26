import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

interface EmptyPagesStateProps {
  onCreateClick: () => void
}

/**
 * Estado vacío cuando no hay landing pages creadas
 */
export function EmptyPagesState({ onCreateClick }: EmptyPagesStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No hay páginas creadas</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        Comienza creando tu primera landing page. Podrás agregar banners,
        productos, FAQs y mucho más.
      </p>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Crear Primera Página
      </Button>
    </div>
  )
}
